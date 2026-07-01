from django.db import migrations


def forwards(apps, schema_editor):
    Project = apps.get_model("db", "Project")
    # Projeto OPEROZ usa identifier OPERI (não OPEROZ)
    Project.objects.filter(identifier__iexact="OPERI").update(intake_view=True)


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0178_enable_operoz_intake_view"),
    ]

    operations = [
        migrations.RunPython(forwards, migrations.RunPython.noop),
    ]
