"""Renomeia a edição de PLANE_COMMUNITY para OPEROZ_COMMUNITY.

O `edition` não é só um default no modelo: o valor fica gravado em `instances`.
Trocar apenas o default deixaria as instâncias existentes com o nome antigo para
sempre, e `register_instance` passaria a comparar contra um valor que nenhuma
linha tem. Por isso o AlterField vem acompanhado de um RunPython.

Reversível: o `reverse` devolve as linhas ao nome antigo, para um migrate para
trás não deixar dado inconsistente com o código anterior.
"""

from django.db import migrations, models

ANTIGO = "PLANE_COMMUNITY"
NOVO = "OPEROZ_COMMUNITY"


def para_operoz(apps, schema_editor):
    Instance = apps.get_model("license", "Instance")
    Instance.objects.filter(edition=ANTIGO).update(edition=NOVO)


def para_plane(apps, schema_editor):
    Instance = apps.get_model("license", "Instance")
    Instance.objects.filter(edition=NOVO).update(edition=ANTIGO)


class Migration(migrations.Migration):
    dependencies = [
        ("license", "0006_instance_is_current_version_deprecated"),
    ]

    operations = [
        migrations.AlterField(
            model_name="instance",
            name="edition",
            field=models.CharField(default=NOVO, max_length=255),
        ),
        migrations.RunPython(para_operoz, para_plane),
    ]
