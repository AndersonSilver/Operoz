import json

from django.http import StreamingHttpResponse
from rest_framework import status
from rest_framework.response import Response

from operoz.app.permissions.board_access import allow_workspace_or_board_admin
from operoz.app.serializers.board_automation import (
    BoardAutomationRuleRevisionSerializer,
    BoardAutomationRuleSerializer,
    BoardAutomationRunSerializer,
)
from operoz.app.views.base import BaseAPIView
from operoz.automation.catalog import catalog_for_board, ensure_catalog
from operoz.automation.domain import DomainEvent
from dataclasses import replace

from operoz.automation.compiler import compile_graph
from operoz.automation.executor import execute_graph, execute_graph_events
from operoz.automation.rule_lifecycle import publish_rule_draft, restore_rule_revision, save_rule_draft
from operoz.automation.run_recorder import persist_automation_run
from operoz.automation.dry_run_event import resolve_board_test_event, run_requires_issue
from operoz.automation.validator import validate_graph
from operoz.automation.analytics import build_board_automation_analytics
from operoz.automation.observability import get_metrics_snapshot
from operoz.db.models import (
    Board,
    BoardAutomationDeadLetter,
    BoardAutomationRule,
    BoardAutomationRuleRevision,
    BoardAutomationRun,
)


def _get_board(slug: str, board_slug: str) -> Board:
    return Board.objects.get(workspace__slug=slug, slug=board_slug, deleted_at__isnull=True)


def _lifecycle_error_response(exc: ValueError):
    message = str(exc)
    if message == "publish_required_before_enable":
        return Response(
            {"error": "Publique o fluxo antes de ativar a automação.", "code": message},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if message == "dry_run_required":
        return Response(
            {
                "error": "Execute um dry-run bem-sucedido da versão publicada antes de ativar.",
                "code": message,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    if message == "revision_not_found":
        return Response({"error": "Revisão não encontrada.", "code": message}, status=status.HTTP_404_NOT_FOUND)
    try:
        payload = json.loads(message)
        if isinstance(payload, dict) and payload.get("graph_errors"):
            return Response(payload, status=status.HTTP_400_BAD_REQUEST)
    except json.JSONDecodeError:
        pass
    return Response({"error": message}, status=status.HTTP_400_BAD_REQUEST)


class BoardAutomationCatalogEndpoint(BaseAPIView):
    @allow_workspace_or_board_admin
    def get(self, request, slug, board_slug):
        board = _get_board(slug, board_slug)
        return Response(catalog_for_board(str(board.id)).to_api_list(), status=status.HTTP_200_OK)


class BoardAutomationRuleListEndpoint(BaseAPIView):
    @allow_workspace_or_board_admin
    def get(self, request, slug, board_slug):
        board = _get_board(slug, board_slug)
        rules = BoardAutomationRule.objects.filter(board=board, deleted_at__isnull=True).order_by(
            "sort_order", "-created_at"
        )
        return Response(BoardAutomationRuleSerializer(rules, many=True).data, status=status.HTTP_200_OK)

    @allow_workspace_or_board_admin
    def post(self, request, slug, board_slug):
        board = _get_board(slug, board_slug)
        data = {**request.data, "board": str(board.id), "workspace": str(board.workspace_id)}
        serializer = BoardAutomationRuleSerializer(data=data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        graph = serializer.validated_data.get("graph") or {}
        validation = validate_graph(graph)
        if graph and not validation["valid"]:
            return Response({"graph_errors": validation["errors"]}, status=status.HTTP_400_BAD_REQUEST)
        rule = serializer.save(board=board, workspace=board.workspace, enabled=False)
        return Response(BoardAutomationRuleSerializer(rule).data, status=status.HTTP_201_CREATED)


class BoardAutomationRuleDetailEndpoint(BaseAPIView):
    def _get_rule(self, slug, board_slug, rule_id):
        board = _get_board(slug, board_slug)
        return BoardAutomationRule.objects.get(pk=rule_id, board=board, deleted_at__isnull=True)

    @allow_workspace_or_board_admin
    def get(self, request, slug, board_slug, rule_id):
        rule = self._get_rule(slug, board_slug, rule_id)
        return Response(BoardAutomationRuleSerializer(rule).data, status=status.HTTP_200_OK)

    @allow_workspace_or_board_admin
    def patch(self, request, slug, board_slug, rule_id):
        rule = self._get_rule(slug, board_slug, rule_id)
        try:
            rule = save_rule_draft(
                rule,
                actor=request.user,
                name=request.data.get("name"),
                description=request.data.get("description"),
                graph=request.data.get("graph"),
                enabled=request.data.get("enabled") if "enabled" in request.data else None,
            )
        except ValueError as exc:
            return _lifecycle_error_response(exc)
        return Response(BoardAutomationRuleSerializer(rule).data, status=status.HTTP_200_OK)

    @allow_workspace_or_board_admin
    def delete(self, request, slug, board_slug, rule_id):
        rule = self._get_rule(slug, board_slug, rule_id)
        rule.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class BoardAutomationRulePublishEndpoint(BaseAPIView):
    @allow_workspace_or_board_admin
    def post(self, request, slug, board_slug, rule_id):
        rule = BoardAutomationRuleDetailEndpoint()._get_rule(slug, board_slug, rule_id)
        try:
            rule = publish_rule_draft(rule, actor=request.user)
        except ValueError as exc:
            return _lifecycle_error_response(exc)
        return Response(BoardAutomationRuleSerializer(rule).data, status=status.HTTP_200_OK)


class BoardAutomationRuleRevisionListEndpoint(BaseAPIView):
    @allow_workspace_or_board_admin
    def get(self, request, slug, board_slug, rule_id):
        rule = BoardAutomationRuleDetailEndpoint()._get_rule(slug, board_slug, rule_id)
        kind = request.query_params.get("kind")
        revisions = BoardAutomationRuleRevision.objects.filter(rule=rule, deleted_at__isnull=True).order_by(
            "-created_at"
        )
        if kind in {BoardAutomationRuleRevision.KIND_DRAFT, BoardAutomationRuleRevision.KIND_PUBLISHED}:
            revisions = revisions.filter(kind=kind)
        revisions = revisions[:100]
        return Response(BoardAutomationRuleRevisionSerializer(revisions, many=True).data, status=status.HTTP_200_OK)


class BoardAutomationRuleRevisionRestoreEndpoint(BaseAPIView):
    @allow_workspace_or_board_admin
    def post(self, request, slug, board_slug, rule_id, revision_id):
        rule = BoardAutomationRuleDetailEndpoint()._get_rule(slug, board_slug, rule_id)
        revision = BoardAutomationRuleRevision.objects.get(
            pk=revision_id,
            rule=rule,
            board=rule.board,
            deleted_at__isnull=True,
        )
        try:
            rule = restore_rule_revision(rule, revision, actor=request.user)
        except ValueError as exc:
            return _lifecycle_error_response(exc)
        return Response(BoardAutomationRuleSerializer(rule).data, status=status.HTTP_200_OK)


class BoardAutomationValidateEndpoint(BaseAPIView):
    @allow_workspace_or_board_admin
    def post(self, request, slug, board_slug):
        _get_board(slug, board_slug)
        graph = request.data.get("graph") or {}
        return Response(validate_graph(graph), status=status.HTTP_200_OK)


class BoardAutomationDryRunEndpoint(BaseAPIView):
    @allow_workspace_or_board_admin
    def post(self, request, slug, board_slug, rule_id):
        rule = BoardAutomationRuleDetailEndpoint()._get_rule(slug, board_slug, rule_id)
        board = rule.board
        event_data = request.data.get("event")
        if not event_data:
            return Response({"error": "event payload obrigatório"}, status=status.HTTP_400_BAD_REQUEST)

        live = request.data.get("live", True)
        if isinstance(live, str):
            live = live.lower() not in ("0", "false", "no")

        graph = request.data.get("graph") or rule.graph

        event = DomainEvent.from_dict(event_data)
        try:
            compiled = compile_graph(graph)
            trigger_type = compiled.trigger.catalog_key
            if trigger_type and event.event_type != trigger_type:
                event = replace(event, event_type=trigger_type)
        except ValueError:
            pass

        event, issue = resolve_board_test_event(board, event)
        if issue is None and run_requires_issue(graph, event):
            return Response(
                {
                    "error": "Nenhum card encontrado neste board para testar a automação.",
                    "code": "no_issue",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        stream = request.data.get("stream", False)
        if isinstance(stream, str):
            stream = stream.lower() in ("1", "true", "yes")

        if stream:

            def event_stream():
                try:
                    for item in execute_graph_events(
                        graph,
                        event,
                        rule_id=str(rule.id),
                        automation_actor=request.user,
                        dry_run=not live,
                    ):
                        if item.get("type") == "done":
                            result = item.get("result") or {}
                            result["live"] = live
                            if issue is not None:
                                result["test_issue_id"] = str(issue.id)
                                result["test_issue_name"] = issue.name
                            run = persist_automation_run(
                                rule, event, graph, result, dry_run=not live
                            )
                            if run is not None:
                                result["run_id"] = str(run.id)
                            if not live:
                                from operoz.automation.policy import mark_dry_run_verified

                                mark_dry_run_verified(rule, graph=graph, result=result)
                            item = {**item, "result": result}
                        yield json.dumps(item, default=str) + "\n"
                except Exception as exc:
                    yield json.dumps({"type": "error", "error": str(exc)}, default=str) + "\n"

            response = StreamingHttpResponse(event_stream(), content_type="application/x-ndjson")
            response["Cache-Control"] = "no-cache"
            response["X-Accel-Buffering"] = "no"
            return response

        result = execute_graph(
            graph,
            event,
            rule_id=str(rule.id),
            automation_actor=request.user,
            dry_run=not live,
        )
        if not live:
            from operoz.automation.policy import mark_dry_run_verified

            mark_dry_run_verified(rule, graph=graph, result=result)
        result["live"] = live
        if issue is not None:
            result["test_issue_id"] = str(issue.id)
            result["test_issue_name"] = issue.name
        run = persist_automation_run(rule, event, graph, result, dry_run=not live)
        if run is not None:
            result["run_id"] = str(run.id)
        return Response(result, status=status.HTTP_200_OK)


class BoardAutomationRunListEndpoint(BaseAPIView):
    @allow_workspace_or_board_admin
    def get(self, request, slug, board_slug):
        board = _get_board(slug, board_slug)
        rule_id = request.query_params.get("rule_id")
        runs = BoardAutomationRun.objects.filter(board=board, deleted_at__isnull=True).select_related("rule")
        if rule_id:
            runs = runs.filter(rule_id=rule_id)
        runs = runs.order_by("-created_at")[:100]
        return Response(BoardAutomationRunSerializer(runs, many=True).data, status=status.HTTP_200_OK)


class BoardAutomationMetricsEndpoint(BaseAPIView):
    @allow_workspace_or_board_admin
    def get(self, request, slug, board_slug):
        board = _get_board(slug, board_slug)
        return Response(
            {
                "metrics": get_metrics_snapshot(),
                "queue": "automation",
                "analytics": build_board_automation_analytics(board),
            },
            status=status.HTTP_200_OK,
        )


class BoardAutomationDeadLetterListEndpoint(BaseAPIView):
    @allow_workspace_or_board_admin
    def get(self, request, slug, board_slug):
        board = _get_board(slug, board_slug)
        entries = BoardAutomationDeadLetter.objects.filter(board=board, deleted_at__isnull=True).order_by(
            "-created_at"
        )[:100]
        data = [
            {
                "id": str(entry.id),
                "rule_id": str(entry.rule_id) if entry.rule_id else None,
                "event_id": entry.event_id,
                "error_message": entry.error_message,
                "retry_count": entry.retry_count,
                "celery_task_id": entry.celery_task_id,
                "created_at": entry.created_at.isoformat() if entry.created_at else None,
            }
            for entry in entries
        ]
        return Response(data, status=status.HTTP_200_OK)
