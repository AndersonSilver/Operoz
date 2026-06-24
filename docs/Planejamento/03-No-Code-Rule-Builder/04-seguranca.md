# 04 — Segurança · No-Code Rule Builder

Baseline em [`00-VISAO-GERAL/03-seguranca-transversal.md`](../00-VISAO-GERAL/03-seguranca-transversal.md).
Grande parte das defesas **já existe** no motor de automação; aqui consolida-se.

## Threat-model específico

| Ameaça | Vetor | Mitigação (existente / nova) |
| --- | --- | --- |
| SSRF via webhook action | URL para rede interna | `policy.webhook_allowed_domains` (allowlist) — **existe** |
| Execução de código perigoso | Script action com `child_process`/`fs`/`eval` | `policy.validate_script_source` + sandbox + timeout/memória — **existe** |
| Loop infinito de regras | Regra A dispara B dispara A | `governance` rate-limit + circuit breaker; **novo:** limite de profundidade de cadeia de eventos |
| Exfiltração via smart values | `{{secret:...}}` num e-mail/webhook | Smart values **não** resolvem segredos; segredos só via `{{secret:key}}` no executor com redação |
| Template injection | Smart value com payload | Template engine com escaping contextual (HTML para e-mail, URL-encode para webhook) |
| Privilégio via from-template | Membro cria regra que age como admin | `from-template` exige `automation.manage` (board admin) |
| Ativar regra não testada | Regra destrutiva direto em produção | Dry-run obrigatório antes de `publish` (`require_dry_run_before_enable`) |
| Abuso de recursos | Regra agendada a cada minuto a varrer tudo | Limites de schedule + governança por board/workspace |

## Smart values — regras de escaping

```text
Contexto e-mail (HTML)   → escape HTML
Contexto webhook (JSON)  → JSON-encode
Contexto URL             → URL-encode
Contexto texto (comment) → texto puro, sem interpolar segredos
```

- `{{issue.*}}`, `{{triggerUser.*}}`, `{{now}}` são permitidos.
- **Nunca** expandir `{{secret:*}}` em smart values do utilizador; segredos só no
  campo de config destinado (resolvido pelo `secrets.py`, redigido em logs).

## Permissões

- Gerir automação → `automation.manage` via `BoardRolePermission` (ou
  `ROLE.ADMIN` workspace).
- O **ator de execução** das ações é o utilizador-sistema da automação, mas as
  ações respeitam permissões de destino (não pode atribuir/alterar o que o board
  não permitiria).

## Governança (reuso)

- `automation/governance.py`: `automation:rate:board:{id}:hour`, circuit breaker
  após N falhas. DLQ para falhas persistentes.
- **Novo:** contador de profundidade de cadeia de eventos no `context_snapshot`
  para cortar loops workflow↔automação (ligação com feature 01).

## Auditoria

- Cada `BoardAutomationRun` regista contexto, grafo e resultado.
- `publish/` e alterações de regra registam ator e diff.
- Segredos sempre redigidos (`redact_for_storage`) antes de persistir runs/logs.

## Rollback

- Regras nascem `enabled=False`/draft; desligar é instantâneo.
- Circuit breaker isola regra problemática sem afetar as outras.
