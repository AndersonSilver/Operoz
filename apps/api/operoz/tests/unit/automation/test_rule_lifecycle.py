import pytest

from operoz.automation.rule_lifecycle import (
    graphs_equal,
    publish_rule_draft,
    rule_has_published_graph,
    rule_has_unpublished_changes,
    save_rule_draft,
)
from operoz.db.models import BoardAutomationRule, BoardAutomationRuleRevision


@pytest.mark.unit
class TestRuleLifecycleHelpers:
    def test_graphs_equal(self):
        assert graphs_equal({"nodes": []}, {"nodes": []}) is True
        assert graphs_equal({"nodes": [{"id": "1"}]}, {"nodes": [{"id": "1"}]}) is True
        assert graphs_equal({"nodes": []}, {"nodes": [{"id": "1"}]}) is False


@pytest.mark.django_db
class TestRuleLifecyclePersistence:
    def test_save_draft_creates_revision(self, workspace_board, workspace, create_user):
        board = workspace_board
        rule = BoardAutomationRule.objects.create(
            workspace=workspace,
            board=board,
            name="Fluxo",
            description="",
            graph={"nodes": [], "edges": []},
            created_by=create_user,
            updated_by=create_user,
        )
        updated = save_rule_draft(
            rule,
            actor=create_user,
            graph={
                "nodes": [
                    {
                        "id": "t1",
                        "data": {
                            "kind": "trigger",
                            "catalog_key": "issue.created",
                            "label": "Card criado",
                            "config": {},
                        },
                    }
                ],
                "edges": [],
            },
        )
        assert updated.graph["nodes"]
        assert (
            BoardAutomationRuleRevision.objects.filter(rule=rule, kind=BoardAutomationRuleRevision.KIND_DRAFT).count()
            == 1
        )
        assert rule_has_unpublished_changes(updated) is True

    def test_publish_copies_draft_to_published(self, workspace_board, workspace, create_user):
        board = workspace_board
        graph = {
            "nodes": [
                {
                    "id": "t1",
                    "data": {"kind": "trigger", "catalog_key": "issue.created", "label": "Card criado", "config": {}},
                },
                {
                    "id": "a1",
                    "data": {"kind": "action", "catalog_key": "action.notify", "label": "Notificar", "config": {}},
                },
            ],
            "edges": [{"id": "e1", "source": "t1", "target": "a1"}],
        }
        rule = BoardAutomationRule.objects.create(
            workspace=workspace,
            board=board,
            name="Fluxo",
            graph=graph,
            created_by=create_user,
            updated_by=create_user,
        )
        published = publish_rule_draft(rule, actor=create_user)
        assert rule_has_published_graph(published) is True
        assert published.published_version == 1
        assert rule_has_unpublished_changes(published) is False
        assert (
            BoardAutomationRuleRevision.objects.filter(
                rule=rule, kind=BoardAutomationRuleRevision.KIND_PUBLISHED
            ).count()
            == 1
        )

    def test_enable_requires_publish(self, workspace_board, workspace, create_user):
        board = workspace_board
        rule = BoardAutomationRule.objects.create(
            workspace=workspace,
            board=board,
            name="Fluxo",
            graph={"nodes": [], "edges": []},
            created_by=create_user,
            updated_by=create_user,
        )
        with pytest.raises(ValueError, match="publish_required_before_enable"):
            save_rule_draft(rule, actor=create_user, enabled=True)
