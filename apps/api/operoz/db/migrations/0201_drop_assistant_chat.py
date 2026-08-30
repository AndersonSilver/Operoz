"""Remove o schema do assistant-chat e do bot de slash commands do Discord.

Escrita à mão de propósito: `makemigrations` arrastaria junto 64 operações de
drift pré-existentes no repo (renomeação de índices em alertlog, AlterField em
workflowscheme etc.), que não têm relação com esta remoção.

IRREVERSÍVEL NA PRÁTICA. O `reverse` recria as tabelas vazias para não travar um
`migrate` para trás, mas histórico de conversa e trilha de auditoria não voltam
sem restore de backup.

O índice RAG (`search_embeddings`) NÃO é tocado — continua alimentando a busca
semântica em /api/v1/workspaces/<slug>/search/semantic/.
"""

from django.db import migrations

# discord_integration saiu de INSTALLED_APPS, então o Django não gerencia mais
# suas migrations: a tabela e as linhas de controle precisam sair via SQL.
DROP_DISCORD_SQL = """
DROP TABLE IF EXISTS discord_custom_slash_commands CASCADE;
DELETE FROM django_migrations WHERE app = 'discord_integration';
"""

# Sem rollback real: recriar a tabela exigiria replicar o schema de um app que
# não existe mais no código. Deixar explícito em vez de fingir reversibilidade.
UNDO_DISCORD_SQL = migrations.RunSQL.noop


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0200_board_circle"),
    ]

    operations = [
        # Ordem: filhos antes dos pais, para não esbarrar em FK.
        # AssistantQualityReview -> AssistantMessage -> AssistantSession
        # AssistantChatJob      -> AssistantSession
        # AssistantActionAudit  -> AssistantSession
        migrations.DeleteModel(name="AssistantQualityReview"),
        migrations.DeleteModel(name="AssistantChatJob"),
        migrations.DeleteModel(name="AssistantActionAudit"),
        migrations.DeleteModel(name="AssistantMessage"),
        migrations.DeleteModel(name="AssistantSession"),
        # Sem FK entre si nem para os de cima.
        migrations.DeleteModel(name="AssistantQualityDaily"),
        migrations.DeleteModel(name="AssistantUsageDaily"),
        migrations.RunSQL(sql=DROP_DISCORD_SQL, reverse_sql=UNDO_DISCORD_SQL),
    ]
