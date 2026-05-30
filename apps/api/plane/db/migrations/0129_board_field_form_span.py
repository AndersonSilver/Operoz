# Tech4Humans: layout do campo no formulário do card (meia / largura total)

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0128_board_lead_default_assignee"),
    ]

    operations = [
        migrations.AddField(
            model_name="boardstandardfield",
            name="form_span",
            field=models.CharField(
                choices=[("half", "Half"), ("full", "Full")],
                default="half",
                max_length=8,
            ),
        ),
        migrations.AddField(
            model_name="boardcustomfield",
            name="form_span",
            field=models.CharField(
                choices=[("half", "Half"), ("full", "Full")],
                default="half",
                max_length=8,
            ),
        ),
    ]
