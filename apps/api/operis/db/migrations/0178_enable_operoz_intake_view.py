from django.db import migrations


def forwards(apps, schema_editor):
    Project = apps.get_model("db", "Project")
    # OPEROZ: projeto interno — Intake clássico + Sustentação (decisão A)
    # identifier real é OPERI; OPEROZ cobre ambientes onde o slug coincide
    Project.objects.filter(identifier__iexact="OPEROZ").update(intake_view=True)
    Project.objects.filter(identifier__iexact="OPERI").update(intake_view=True)


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0177_intake_support_split"),
    ]

    operations = [
        migrations.RunPython(forwards, migrations.RunPython.noop),
    ]
