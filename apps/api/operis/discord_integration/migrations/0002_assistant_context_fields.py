import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0184_intake_form_slug_anchors"),
        ("discord_integration", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="customslashcommand",
            name="board_slug",
            field=models.CharField(
                blank=True,
                default="",
                help_text="Board Operoz usado pelo assistente ao executar o comando (opcional).",
                max_length=255,
            ),
        ),
        migrations.AddField(
            model_name="customslashcommand",
            name="default_project",
            field=models.ForeignKey(
                blank=True,
                help_text="Projeto/cliente em foco para ferramentas do assistente (opcional).",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="discord_slash_commands",
                to="db.project",
            ),
        ),
    ]
