"""Seed FinOps demo data (profiles + consultant allocations) for Visão 360."""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Any

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from operis.db.models import (
    Client360ConsultantAllocation,
    Client360ProjectFinopsProfile,
    Project,
    Workspace,
    WorkspaceMember,
)
from operis.utils.client_360_finops import month_start

DEMO_PROFILES: list[dict[str, Any]] = [
    {
        "identifier": "OPEROZDP",
        "hours_allocated": Decimal("180"),
        "capacity_hours": Decimal("160"),
        "budget_planned": Decimal("85000"),
        "budget_actual": Decimal("102000"),
        "revenue_contract": Decimal("140000"),
        "harness_cost_mtd": Decimal("42000"),
    },
    {
        "identifier": "MGL",
        "hours_allocated": Decimal("120"),
        "capacity_hours": Decimal("160"),
        "budget_planned": Decimal("60000"),
        "budget_actual": Decimal("71500"),
        "revenue_contract": Decimal("78000"),
        "harness_cost_mtd": Decimal("28000"),
    },
    {
        "identifier": "TRADICAOPO",
        "hours_allocated": Decimal("90"),
        "capacity_hours": Decimal("160"),
        "budget_planned": Decimal("45000"),
        "budget_actual": Decimal("46800"),
        "revenue_contract": Decimal("62000"),
        "harness_cost_mtd": Decimal("18500"),
    },
    {
        "identifier": "UNIF",
        "hours_allocated": Decimal("64"),
        "capacity_hours": Decimal("160"),
        "budget_planned": Decimal("32000"),
        "budget_actual": Decimal("29500"),
        "revenue_contract": Decimal("48000"),
        "harness_cost_mtd": Decimal("11200"),
    },
]

# consultant hours per project identifier
DEMO_ALLOCATIONS: dict[str, list[tuple[str, Decimal]]] = {
    "OPEROZDP": [("primary", Decimal("72")), ("secondary", Decimal("48"))],
    "MGL": [("primary", Decimal("56")), ("secondary", Decimal("32"))],
    "TRADICAOPO": [("primary", Decimal("40"))],
    "UNIF": [("secondary", Decimal("24"))],
}


class Command(BaseCommand):
    help = "Seed demo FinOps profiles and consultant allocations for Visão 360"

    def add_arguments(self, parser):
        parser.add_argument("--workspace", type=str, default="operoz", help="Workspace slug")
        parser.add_argument(
            "--period-month",
            type=str,
            default="",
            help="First day of month (YYYY-MM-DD). Default: current month",
        )
        parser.add_argument("--reset", action="store_true", help="Remove existing demo rows for this month first")

    @transaction.atomic
    def handle(self, *args: Any, **options: Any) -> None:
        slug = options["workspace"]
        try:
            workspace = Workspace.objects.get(slug=slug, deleted_at__isnull=True)
        except Workspace.DoesNotExist as exc:
            raise CommandError(f"Workspace '{slug}' not found") from exc

        if options["period_month"]:
            parts = options["period_month"].split("-")
            period = date(int(parts[0]), int(parts[1]), 1)
        else:
            period = month_start()

        members = list(
            WorkspaceMember.objects.filter(workspace=workspace, deleted_at__isnull=True)
            .select_related("member")
            .order_by("created_at")[:2]
        )
        if not members:
            raise CommandError(f"No workspace members in '{slug}'")

        primary_member = members[0].member
        secondary_member = members[1].member if len(members) > 1 else members[0].member
        member_by_key = {"primary": primary_member, "secondary": secondary_member}

        project_ids = [row["identifier"] for row in DEMO_PROFILES]
        projects = {
            p.identifier: p
            for p in Project.objects.filter(
                workspace=workspace,
                identifier__in=project_ids,
                archived_at__isnull=True,
            )
        }
        missing = [ident for ident in project_ids if ident not in projects]
        if missing:
            self.stdout.write(self.style.WARNING(f"Projects not found (skipped): {', '.join(missing)}"))

        if options["reset"]:
            pids = [p.id for p in projects.values()]
            Client360ProjectFinopsProfile.objects.filter(
                workspace=workspace,
                project_id__in=pids,
                period_month=period,
            ).delete()
            Client360ConsultantAllocation.objects.filter(
                workspace=workspace,
                project_id__in=pids,
                period_month=period,
            ).delete()
            self.stdout.write(self.style.WARNING("Removed existing FinOps rows for period"))

        now = timezone.now()
        created_profiles = 0
        for spec in DEMO_PROFILES:
            project = projects.get(spec["identifier"])
            if not project:
                continue
            row, created = Client360ProjectFinopsProfile.objects.update_or_create(
                workspace=workspace,
                project=project,
                period_month=period,
                defaults={
                    "hours_allocated": spec["hours_allocated"],
                    "capacity_hours": spec["capacity_hours"],
                    "budget_planned": spec["budget_planned"],
                    "budget_actual": spec["budget_actual"],
                    "revenue_contract": spec["revenue_contract"],
                    "harness_cost_mtd": spec["harness_cost_mtd"],
                    "harness_last_sync_at": now,
                },
            )
            created_profiles += 1 if created else 0
            self.stdout.write(f"  profile {project.identifier}: cost={spec['harness_cost_mtd']}")

        created_allocs = 0
        for ident, allocs in DEMO_ALLOCATIONS.items():
            project = projects.get(ident)
            if not project:
                continue
            for member_key, hours in allocs:
                member = member_by_key[member_key]
                _, created = Client360ConsultantAllocation.objects.update_or_create(
                    workspace=workspace,
                    project=project,
                    member=member,
                    period_month=period,
                    defaults={"hours": hours},
                )
                created_allocs += 1 if created else 0
                self.stdout.write(f"  allocation {project.identifier} / {member.email}: {hours}h")

        self.stdout.write(
            self.style.SUCCESS(
                f"FinOps demo seeded in '{slug}' for {period.isoformat()} "
                f"({len(projects)} projects, {created_profiles} new profiles, {created_allocs} new allocations)"
            )
        )
