from __future__ import annotations

import uuid

from rest_framework import status
from rest_framework.response import Response

from operoz.app.permissions.board_access import allow_workspace_or_board_admin
from operoz.app.serializers.board_automation import BoardAutomationRuleSerializer
from operoz.app.views.base import BaseAPIView
from operoz.app.views.board.automation import _get_board, _lifecycle_error_response
from operoz.automation.domain import DomainEvent
from operoz.automation.executor import execute_graph
from operoz.automation.graph_trigger import extract_trigger_from_graph
from operoz.automation.rule_lifecycle import publish_rule_draft
from operoz.automation.templates_registry import (
    build_rule_from_template,
    get_automation_template,
    list_automation_templates,
)
from operoz.automation.dry_run_event import resolve_board_test_event, run_requires_issue
from operoz.db.models import BoardAutomationRule


def _build_template_test_event(board, graph: dict, rule_id: str) -> DomainEvent:
    extracted = extract_trigger_from_graph(graph)
    if not extracted:
        raise ValueError("no_trigger")
    trigger_key, _ = extracted

    if trigger_key == "schedule.cron":
        return DomainEvent.create(
            event_type="schedule.cron",
            workspace_id=str(board.workspace_id),
            board_id=str(board.id),
            actor_id=None,
            entity_type="schedule",
            entity_id=rule_id,
            project_id=None,
            payload={},
        )

    if trigger_key == "intake.submitted":
        return DomainEvent.create(
            event_type="intake.submitted",
            workspace_id=str(board.workspace_id),
            board_id=str(board.id),
            actor_id=None,
            entity_type="intake",
            entity_id=str(uuid.uuid4()),
            project_id=None,
            payload={},
        )

    return DomainEvent.create(
        event_type=trigger_key,
        workspace_id=str(board.workspace_id),
        board_id=str(board.id),
        actor_id=None,
        entity_type="issue",
        entity_id=str(uuid.uuid4()),
        project_id=None,
        payload={},
    )


class BoardAutomationTemplateListEndpoint(BaseAPIView):
    @allow_workspace_or_board_admin
    def get(self, request, slug, board_slug):
        _get_board(slug, board_slug)
        return Response(list_automation_templates(), status=status.HTTP_200_OK)


class BoardAutomationTemplateInstallEndpoint(BaseAPIView):
    @allow_workspace_or_board_admin
    def post(self, request, slug, board_slug, template_id):
        board = _get_board(slug, board_slug)
        template = get_automation_template(template_id)
        if not template:
            return Response(
                {"error": "Template não encontrado.", "code": "not_found"}, status=status.HTTP_404_NOT_FOUND
            )

        parameters = request.data.get("parameters") or {}
        publish = bool(request.data.get("publish", False))
        run_dry_run = bool(request.data.get("dry_run", False))

        try:
            rule_payload = build_rule_from_template(
                template,
                parameters,
                name=request.data.get("name"),
                description=request.data.get("description"),
            )
        except ValueError as exc:
            message = str(exc)
            try:
                import json

                payload = json.loads(message)
                if isinstance(payload, dict) and payload.get("graph_errors"):
                    return Response(payload, status=status.HTTP_400_BAD_REQUEST)
            except json.JSONDecodeError:
                pass
            if message.startswith("parameter_required:"):
                return Response(
                    {"error": "Parâmetro obrigatório ausente.", "code": message},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            return Response({"error": message}, status=status.HTTP_400_BAD_REQUEST)

        rule = BoardAutomationRule.objects.create(
            board=board,
            workspace=board.workspace,
            name=rule_payload["name"],
            description=rule_payload["description"],
            graph=rule_payload["graph"],
            enabled=False,
        )

        response_payload: dict = {"rule": BoardAutomationRuleSerializer(rule).data, "template_id": template_id}

        if run_dry_run:
            event = _build_template_test_event(board, rule.graph, str(rule.id))
            event, issue = resolve_board_test_event(board, event)
            if issue is None and run_requires_issue(rule.graph, event):
                response_payload["dry_run"] = {
                    "ok": False,
                    "code": "no_issue",
                    "message": "Nenhum card no board para testar este template.",
                }
            else:
                live = bool(request.data.get("live", False))
                response_payload["dry_run"] = execute_graph(
                    rule.graph,
                    event,
                    rule_id=str(rule.id),
                    automation_actor=request.user,
                    dry_run=not live,
                )

        if publish:
            try:
                rule = publish_rule_draft(rule, actor=request.user)
                response_payload["rule"] = BoardAutomationRuleSerializer(rule).data
            except ValueError as exc:
                return _lifecycle_error_response(exc)

        return Response(response_payload, status=status.HTTP_201_CREATED)
