# Guia — Automation Packs Operoz

Automation Packs são pacotes instaláveis por board, no estilo plugins do Claude Code. Cada pack vive em `packs/automation-packs/<nome>/`.

## Estrutura

```text
operoz-pack-exemplo/
├── pack.json
├── hooks/
│   └── hooks.json
└── (opcional) playbooks/
```

## `pack.json`

Campos obrigatórios: `name`, `version`, `description`, `permissions`.

| Campo         | Descrição                                           |
| ------------- | --------------------------------------------------- |
| `name`        | Identificador único (`a-z`, hífens)                 |
| `version`     | Semver `MAJOR.MINOR.PATCH`                          |
| `permissions` | Lista de `catalog_key` usados pelo pack             |
| `hooks`       | Caminho relativo para `hooks.json`                  |
| `catalog`     | Entradas extras no catálogo (somente `handler_ref`) |
| `rules`       | Regras a criar a partir de templates oficiais       |

Schema: `packs/automation-packs/schema.json`

## Sandbox (segurança)

**Proibido** em packs de produção:

- `handler`, `python_module`, `import_path`, `callable` em catalog
- Código Python arbitrário em hooks

**Catalog dinâmico:** cada entrada deve declarar `handler_ref` apontando para uma chave **built-in** já registrada (`action.send_email`, `schedule.cron`, etc.).

**Hooks:** apenas `handler_type` da allowlist do modelo `BoardAutomationHook`:

- `block_catalog_key`
- `webhook_domain_allowlist`
- `record_metric`

## Validar localmente

```bash
docker compose -f Operoz/docker-compose-local.yml exec api \
  python manage.py validate_automation_pack --all

docker compose -f Operoz/docker-compose-local.yml exec api \
  python manage.py validate_automation_pack operoz-pack-gestao-operacional
```

## Instalar num board (API)

```http
GET  /api/workspaces/{slug}/boards/{board_slug}/automation/packs/
POST /api/workspaces/{slug}/boards/{board_slug}/automation/packs/{pack_name}/install/
POST /api/workspaces/{slug}/boards/{board_slug}/automation/packs/{pack_name}/uninstall/
```

Body install (opcional):

```json
{
  "config": {},
  "create_rules": true,
  "publish": false
}
```

## Pack oficial

`operoz-pack-gestao-operacional` — status report semanal, lembrete SLA sustentação, alerta sem assignee + hook de métrica pós-ação.

## CI

Incluir no pipeline de API:

```bash
python manage.py validate_automation_pack --all
pytest operoz/tests/unit/automation/test_packs_registry.py -q
```
