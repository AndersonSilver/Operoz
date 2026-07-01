from datetime import date

import pytest

from operoz.alerts.discord_embed import build_discord_alert_embed, build_discord_alert_message
from operoz.alerts.types import AlertContext, AlertSubject
from operoz.discord_integration.services.discord_formatting import (
    OPEROZ_EMBED_COLOR,
    OPEROZ_EMBED_COLOR_DANGER,
    OPEROZ_EMBED_COLOR_WARNING,
)


class _FakeProject:
    identifier = "CLIEN"
    name = "Cliente XYZ"


class _FakeState:
    name = "Backlog"


class _FakeWorkspace:
    slug = "operoz"
    name = "Operoz"


class _FakeUser:
    email = "dev@operoz.io"
    display_name = "dev"
    first_name = "Dev"
    last_name = "User"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()


class _FakeIssue:
    def __init__(self):
        self.id = "issue-1"
        self.sequence_id = 29
        self.name = "Implementar login"
        self.priority = "high"
        self.target_date = date(2026, 6, 30)
        self.project = _FakeProject()
        self.state = _FakeState()
        self.workspace = _FakeWorkspace()
        self.assignees = _AssigneeManager([_FakeUser()])


class _FakeIntakeIssue:
    def __init__(self):
        self.external_id = "OPS-6503"
        self.source_email = "analista@cliente.com"
        self.created_by_id = None
        self.created_by = None
        self.support_queue = _FakeQueue()
        self.issue = _FakeIssue()
        self.extra = {
            "support": {
                "criticality": "p3",
                "ticket_number": "44559",
            },
            "submission": {"client": "CAIXA Consórcio"},
        }


class _FakeQueue:
    name = "Triagem"


class _AssigneeManager:
    def __init__(self, users):
        self._users = users

    def all(self):
        return self._users


@pytest.mark.unit
def test_build_discord_alert_message_issue_created():
    issue = _FakeIssue()
    context = AlertContext(
        subject=AlertSubject(issue=issue),
        user=_FakeUser(),
        alert_type="issue_created",
        workspace=_FakeWorkspace(),
        issue_url="https://app.operoz.io/operoz/projects/p1/issues/i1",
    )

    content, embed = build_discord_alert_message(context)

    assert content == "Novo card criado no Operoz."
    assert embed["title"] == "[CLIEN-29] Implementar login · Alta"
    assert "• **Projeto:** Cliente XYZ" in embed["description"]
    assert "• **Responsáveis:** Dev User" in embed["description"]
    assert "• **Resumo:** Implementar login" in embed["description"]
    assert "[Abrir no Operoz]" in embed["description"]
    assert embed["author"]["name"] == "Operoz OS"
    assert embed["footer"]["text"] == "Operoz OS"
    assert embed["color"] == OPEROZ_EMBED_COLOR_WARNING


@pytest.mark.unit
def test_build_discord_alert_message_support_ticket():
    issue = _FakeIssue()
    issue.name = "CRITICO | WEBAPP | ERRO HISTORICO DE INTERAÇÕES"
    intake = _FakeIntakeIssue()
    context = AlertContext(
        subject=AlertSubject(issue=issue, intake_issue=intake),
        user=_FakeUser(),
        alert_type="support_ticket_created",
        workspace=_FakeWorkspace(),
        issue_url="https://app.operoz.io/issue",
    )

    content, embed = build_discord_alert_message(context)

    assert "Novo chamado de suporte criado" in content
    assert embed["title"].startswith("Suporte [OPS-6503]")
    assert "CAIXA Consórcio" in embed["title"]
    assert "P3" in embed["title"]
    assert "• **Cliente:** CAIXA Consórcio" in embed["description"]
    assert "• **Criticidade:** P3 — BAIXO" in embed["description"]
    assert "• **Número do chamado:** 44559" in embed["description"]
    assert "• **Relator:** analista@cliente.com" in embed["description"]


@pytest.mark.unit
def test_build_discord_alert_embed_due_date_overdue():
    issue = _FakeIssue()
    context = AlertContext(
        subject=AlertSubject(issue=issue),
        user=_FakeUser(),
        alert_type="due_date_overdue",
        workspace=_FakeWorkspace(),
        extra={"days_overdue": 2},
        issue_url="https://app.operoz.io/issue",
    )

    content, embed = build_discord_alert_message(context)

    assert "Atrasado há 2 dia(s)" in content
    assert embed["color"] == OPEROZ_EMBED_COLOR_DANGER
