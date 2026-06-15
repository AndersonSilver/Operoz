# PRD Review — permissões (RBAC)

## Endpoints workspace (membro autenticado)

| Endpoint                    | Guest | Member | Admin |
| --------------------------- | ----- | ------ | ----- |
| `GET …/prd-review-inbox/`   | sim\* | sim    | sim   |
| `GET …/prd-review-metrics/` | sim\* | sim    | sim   |

\*Apenas sessões de projetos onde o utilizador é `ProjectMember` activo.

## Endpoints por página/projeto

| Acção                    | Guest | Member | Admin |
| ------------------------ | ----- | ------ | ----- |
| Listar sessões / detalhe | sim   | sim    | sim   |
| Criar sessão / convites  | não   | sim    | sim   |
| `POST …/sync-to-issue/`  | não   | sim    | sim   |

Implementação: `PageReviewPermission` (herda `ProjectPagePermission`, nega `POST` a guest).

## Guest (token)

- `GET/POST /api/guest/prd-review/{token}/` — sem login Operoz
- Token expirado/revogado → `410 Gone`
- Sem acesso a outros projectos ou páginas privadas fora do convite
- Após `approved` / `changes_requested` → sessão read-only (`409` em novos comentários)

## Assistente Operoz

- Tool `get_prd_review_summary` — exige membro do projecto e `can_access_page`
