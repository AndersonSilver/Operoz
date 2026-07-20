from django.core.management.base import BaseCommand

from operoz.alerts.seed import seed_all_workspaces_missing_rules


class Command(BaseCommand):
    help = (
        "Seed missing default alert rules for all workspaces "
        "(creates only alert_types that are not present yet)."
    )

    def handle(self, *args, **options):
        created = seed_all_workspaces_missing_rules()
        self.stdout.write(self.style.SUCCESS(f"Created {created} default alert rule(s)."))
