from types import SimpleNamespace
from unittest.mock import Mock

import pytest

from operoz.app.serializers.issue import IssueListDetailSerializer


def _issue_instance(*, with_prefetch: bool):
    related = SimpleNamespace(
        id="related-1",
        project_id="proj-1",
        sequence_id=2,
        name="Successor",
        state_id="state-1",
        priority="none",
        created_by_id="user-1",
        created_at=None,
        updated_at=None,
        updated_by_id=None,
    )
    relation = SimpleNamespace(relation_type="blocked_by", related_issue=related, issue=related)

    issue = Mock()
    issue.id = "issue-1"
    issue.name = "Predecessor"
    issue.state_id = "state-1"
    issue.type_id = None
    issue.sort_order = 0
    issue.completed_at = None
    issue.estimate_point_id = None
    issue.priority = "none"
    issue.start_date = None
    issue.target_date = None
    issue.sequence_id = 1
    issue.project_id = "proj-1"
    issue.parent_id = None
    issue.created_at = None
    issue.updated_at = None
    issue.created_by_id = "user-1"
    issue.updated_by_id = None
    issue.is_draft = False
    issue.archived_at = None
    issue.cycle_id = None
    issue.sub_issues_count = 0
    issue.attachment_count = 0
    issue.link_count = 0
    issue.issue_module.all.return_value = []
    issue.label_issue.all.return_value = []
    issue.issue_assignee.all.return_value = []
    issue.issue_relation.all.return_value = [relation]
    issue.issue_related.all.return_value = []

    if with_prefetch:
        issue._prefetched_objects_cache = {"issue_relation": True, "issue_related": True}

    return issue


@pytest.mark.unit
def test_issue_list_detail_serializer_includes_relations_when_prefetched():
    issue = _issue_instance(with_prefetch=True)
    data = IssueListDetailSerializer(issue).data

    assert "issue_relation" in data
    assert data["issue_relation"][0]["id"] == "related-1"
    assert data["issue_relation"][0]["relation_type"] == "blocked_by"
    assert "issue_related" in data


@pytest.mark.unit
def test_issue_list_detail_serializer_omits_relations_without_prefetch_or_expand():
    issue = _issue_instance(with_prefetch=False)
    data = IssueListDetailSerializer(issue).data

    assert "issue_relation" not in data
    assert "issue_related" not in data
