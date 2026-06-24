# 02 — Contrato de API · No-Code Rule Builder

Padrões em [`00-VISAO-GERAL/01-padroes-backend.md`](../00-VISAO-GERAL/01-padroes-backend.md).
Muitos endpoints **já existem** em `app/views/board/automation*.py`; aqui
documenta-se o conjunto e o que é novo.

## Endpoints

```text
# Regras (CRUD) — JÁ EXISTE em automation.py / automation_policy.py
GET    /api/workspaces/{slug}/boards/{bslug}/automation/rules/
POST   /api/workspaces/{slug}/boards/{bslug}/automation/rules/
PATCH  /api/workspaces/{slug}/boards/{bslug}/automation/rules/{id}/
DELETE /api/workspaces/{slug}/boards/{bslug}/automation/rules/{id}/
POST   /api/.../automation/rules/{id}/publish/
POST   /api/.../automation/rules/{id}/dry-run/      # reusa dry_run_event.py

# Catálogo no-code (NOVO) — alimenta a paleta e os formulários
GET    /api/workspaces/{slug}/automation/catalog/   # triggers/conditions/actions + JSON Schema

# Templates (NOVO)
GET    /api/workspaces/{slug}/automation/templates/
POST   /api/workspaces/{slug}/boards/{bslug}/automation/rules/from-template/  { template_key, params }

# Observabilidade — JÁ EXISTE (automation_hooks/metrics/history/dlq)
GET    /api/.../automation/runs/
GET    /api/.../automation/metrics/
GET    /api/.../automation/dlq/
```

## Permissões

| Endpoint | Decorator |
| --- | --- |
| Rules (escrita), publish, from-template | `@allow_permission([ROLE.ADMIN], level="WORKSPACE")` ou board-admin via `BoardRolePermission` |
| Catálogo, templates (leitura) | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` |
| dry-run | `ROLE.ADMIN` (board) |

> Configurar automação que age sobre dados exige privilégio de admin do board.
> Reusar a permissão fina `BoardRolePermission` (chave `automation.manage`).

## Catálogo (resposta)

```jsonc
// GET .../automation/catalog/
{
  "triggers": [
    { "key": "issue.transitioned", "label": "Quando issue muda de estado",
      "schema": { "type": "object", "properties": {
        "to_state": { "type": "string", "x-source": "states" } } } }
  ],
  "conditions": [
    { "key": "oql.matches", "label": "Quando OQL corresponde",
      "schema": { "properties": { "query": { "type": "string",
                  "x-widget": "oql" } } } }
  ],
  "actions": [
    { "key": "email.send", "label": "Enviar e-mail",
      "schema": { "properties": { "to": {...}, "template": {...} } } }
  ]
}
```

- `x-source`/`x-widget` dizem ao frontend que widget usar (seletor de estados,
  editor OQL, picker de utilizador) — formulários gerados, não hard-coded.

## from-template

```jsonc
// POST .../rules/from-template/
{ "template_key": "auto_close_stale", "params": { "days": 30, "state": "Done" } }
// 201 → cria BoardAutomationRule com graph parametrizado, em modo draft
```

## Notas

- O grafo gravado é exatamente o que `compiler.py` consome — o catálogo só
  garante que cada bloco no-code produz nós válidos.
- `dry-run/` devolve a timeline de passos simulados (sem efeitos colaterais
  reais), reusando `dry_run_event.py`.
