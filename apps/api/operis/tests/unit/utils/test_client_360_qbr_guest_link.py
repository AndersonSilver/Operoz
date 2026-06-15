from __future__ import annotations

from datetime import timedelta

import pytest
from django.utils import timezone

from operis.db.models import Client360QbrGuestLink
from operis.utils.client_360 import WeekPeriod
from operis.utils.client_360_qbr_guest_link import (
    build_guest_link_url,
    parse_guest_link_ttl_days,
    resolve_guest_link,
    sanitize_qbr_payload_for_guest,
)


class TestParseGuestLinkTtl:
    def test_default_fourteen_days(self):
        days, err = parse_guest_link_ttl_days(None)
        assert err is None
        assert days == 14


class TestSanitizeGuestPayload:
    def test_strips_pii_fields(self):
        payload = {
            "title": "QBR",
            "clients": [
                {
                    "name": "Acme",
                    "identifier": "ACM",
                    "health": "ok",
                    "health_score": 80,
                    "status_report": {"coverage": "complete"},
                    "issues": {"overdue": 0},
                    "support": {"open": 0},
                    "responsible_stakeholder": {"email": "secret@example.com"},
                    "project_lead": {"email": "lead@example.com"},
                    "board": {"name": "Board A", "slug": "board-a"},
                }
            ],
        }
        sanitized = sanitize_qbr_payload_for_guest(payload)
        client = sanitized["clients"][0]
        assert "responsible_stakeholder" not in client
        assert client["board"] == {"name": "Board A"}


class TestResolveGuestLink:
    @pytest.mark.django_db
    def test_expired_link_returns_410(self, workspace, create_user):
        period = WeekPeriod(start=timezone.now().date(), end=timezone.now().date())
        link = Client360QbrGuestLink.objects.create(
            workspace=workspace,
            scope=Client360QbrGuestLink.SCOPE_PORTFOLIO,
            period_start=period.start,
            period_end=period.end,
            expires_at=timezone.now() - timedelta(days=1),
            created_by=create_user,
        )
        _, payload, status_code = resolve_guest_link(link.token)
        assert status_code == 410
        assert payload["error"]

    @pytest.mark.django_db
    def test_revoked_link_returns_403(self, workspace, create_user):
        period = WeekPeriod(start=timezone.now().date(), end=timezone.now().date())
        link = Client360QbrGuestLink.objects.create(
            workspace=workspace,
            scope=Client360QbrGuestLink.SCOPE_PORTFOLIO,
            period_start=period.start,
            period_end=period.end,
            expires_at=timezone.now() + timedelta(days=7),
            revoked_at=timezone.now(),
            created_by=create_user,
        )
        _, payload, status_code = resolve_guest_link(link.token)
        assert status_code == 403


class TestGuestLinkUrl:
    def test_builds_web_path(self, settings):
        settings.WEB_URL = "https://app.operoz.test"
        settings.APP_BASE_URL = None
        assert build_guest_link_url("abc123").endswith("/guest/qbr/abc123")

    def test_prefers_app_base_url_over_web_url(self, settings):
        settings.WEB_URL = "http://localhost:8000"
        settings.APP_BASE_URL = "http://localhost:3000"
        assert build_guest_link_url("abc123") == "http://localhost:3000/guest/qbr/abc123"
