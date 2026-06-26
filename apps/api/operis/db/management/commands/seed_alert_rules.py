from django.core.management.base import BaseCommand

from operis.alerts.seed import seed_all_workspaces_missing_rules


class Command(BaseCommand):
    help = "Seed default alert rules for workspaces that have none."

    def handle(self, *args, **options):
        created = seed_all_workspaces_missing_rules()
        self.stdout.write(self.style.SUCCESS(f"Created {created} default alert rule(s)."))
