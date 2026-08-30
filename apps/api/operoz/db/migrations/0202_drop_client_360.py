"""Remove o schema do Cliente 360 / Visão 360.

Escrita à mão pelo mesmo motivo da 0201: `makemigrations` arrastaria junto as
operações de drift pré-existentes no repo (renomeação de índices em alertlog,
AlterField em workflowscheme etc.), sem relação com esta remoção.

Antes dos drops, move `support_sla_days` para `BoardSupportSlaPolicy`. O campo
vivia em `BoardClient360HealthSettings`, mas quem lia era o Intake/Suporte — uma
dependência invertida que sobreviveria à remoção do 360. A cópia dos valores
roda antes do drop para não perder configuração de board existente.

IRREVERSÍVEL NA PRÁTICA quanto aos dados: o `reverse` recria as tabelas vazias
para não travar um migrate para trás, mas o conteúdo não volta sem backup.
"""

from django.db import migrations, models

# Ordem: filhos antes dos pais. As únicas FKs internas são
# Client360QbrGuestAccessLog -> Client360QbrGuestLink e
# Client360WebhookDeliveryLog -> Client360WebhookSubscription.
MODELS_TO_DELETE = [
    "Client360QbrGuestAccessLog",
    "Client360QbrGuestLink",
    "Client360WebhookDeliveryLog",
    "Client360WebhookSubscription",
    "BoardClient360HealthSettings",
    "BoardClient360IntakeType",
    "Client360AuditEntry",
    "Client360ConsultantAllocation",
    "Client360CrmSyncRun",
    "Client360HarnessCostLineItem",
    "Client360HealthSnapshot",
    "Client360Narrative",
    "Client360ProjectFinopsProfile",
    "Client360QbrDraft",
    "Client360StatusReportReminderLog",
    "Client360SuggestedActionDismissal",
    "Client360WorkspaceSharedView",
    "WorkspaceClient360EnterpriseSettings",
    "WorkspaceClient360FinopsSettings",
    "WorkspaceClient360ScenarioPlaybook",
    "WorkspaceClient360Settings",
    "WorkspaceClient360WeeklyBriefing",
    # Por último: Project.client360_customer é removido antes, na primeira operação.
    "Client360Customer",
]


def copy_support_sla_days(apps, schema_editor):
    """Preserva o SLA por board configurado na tela de saúde do 360."""
    HealthSettings = apps.get_model("db", "BoardClient360HealthSettings")
    SlaPolicy = apps.get_model("db", "BoardSupportSlaPolicy")

    for setting in HealthSettings.objects.exclude(support_sla_days=None).iterator():
        if not setting.board_id or not setting.support_sla_days:
            continue
        SlaPolicy.objects.filter(board_id=setting.board_id).update(support_sla_days=setting.support_sla_days)


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0201_drop_assistant_chat"),
    ]

    operations = [
        migrations.AddField(
            model_name="boardsupportslapolicy",
            name="support_sla_days",
            field=models.PositiveSmallIntegerField(default=7),
        ),
        migrations.RunPython(copy_support_sla_days, migrations.RunPython.noop),
        # Solta a referência do Project antes de apagar Client360Customer.
        migrations.RemoveField(model_name="project", name="client360_customer"),
        migrations.AlterField(
            model_name="searchembedding",
            name="entity_type",
            field=models.CharField(
                choices=[
                    ("issue", "Issue"),
                    ("page", "Page"),
                    ("comment", "Comment"),
                    ("playbook", "Playbook"),
                ],
                max_length=32,
            ),
        ),
        *[migrations.DeleteModel(name=name) for name in MODELS_TO_DELETE],
    ]
