"""Renomeia a chave do widget new_at_plane para new_at_operoz.

`WorkspaceHomePreference.key` guarda a chave do widget como texto. Trocar apenas
o valor do TextChoices deixaria as 11 linhas existentes em produção apontando
para uma chave que o código não conhece mais: o widget sumiria da home e a
preferência de quem o desabilitou seria ignorada.

Vem junto o AlterField do help_text de `issue_notify_email_include_extended_activities`,
que só mudou de redação — sem efeito em banco, mas o Django exige a operação
para o estado do modelo bater.
"""

from django.db import migrations, models

ANTIGA = "new_at_plane"
NOVA = "new_at_operoz"


def para_operoz(apps, schema_editor):
    Pref = apps.get_model("db", "WorkspaceHomePreference")
    Pref.objects.filter(key=ANTIGA).update(key=NOVA)


def para_plane(apps, schema_editor):
    Pref = apps.get_model("db", "WorkspaceHomePreference")
    Pref.objects.filter(key=NOVA).update(key=ANTIGA)


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0203_sync_model_state"),
    ]

    operations = [
        migrations.AlterField(
            model_name="workspace",
            name="issue_notify_email_include_extended_activities",
            field=models.BooleanField(
                default=False,
                help_text=(
                    "Emit issue notifications for module/cycle/reactions/votes/drafts (Operoz skips these by default)."
                ),
            ),
        ),
        migrations.RunPython(para_operoz, para_plane),
    ]
