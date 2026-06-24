# 04 — Segurança · Dashboard Builder

Baseline em [`00-VISAO-GERAL/03-seguranca-transversal.md`](../00-VISAO-GERAL/03-seguranca-transversal.md).

## Risco central: dashboard partilhado vaza dados via gadget

Um dashboard partilhado não pode revelar a quem o vê dados que essa pessoa não
poderia ver diretamente.

| Ameaça | Vetor | Mitigação |
| --- | --- | --- |
| Fuga via gadget OQL | Owner com mais acesso partilha gadget; viewer vê dados restritos | `gadget/data/` resolve **no contexto do viewer** (run_oql com `request.user`), nunca do owner |
| Edição não autorizada | Viewer altera gadgets | `permission=view` só lê; edição exige owner/`edit`/ADMIN |
| Partilha indevida | Membro partilha dashboard com todo o workspace | Só owner/ADMIN gere shares |
| OQL maliciosa no gadget | Injeção/DoS via config | Reusa todas as defesas da OQL (feature 02): whitelist, sem SQL, throttle |
| DoS por auto-refresh | Muitos gadgets a poll agressivo | `refresh_interval_seconds` com mínimo (ex.: 60s); throttle no `data/` |
| IDOR no gadget | `gid` de outro dashboard | Verificar `gadget.dashboard_id == dashboard_id` da rota |

## Regra de ouro

```text
Os dados de um gadget são SEMPRE calculados com as permissões de quem faz o
request — não as de quem criou o dashboard ou o gadget.
```

Isto torna a partilha segura por construção: a estrutura (que gadgets existem) é
partilhada; os dados são recortados por viewer.

## RBAC

- Ver: owner, share aplicável (workspace/projeto/user), ou `is_shared` + membro.
- Editar: owner, share `edit`, ou ADMIN.
- Shares: owner/ADMIN.

## Validação

- `gadget_type` no `GADGET_REGISTRY`; `config` validado pelo schema do tipo.
- `position` com limites (w/h máximos) para evitar layout abusivo.
- `refresh_interval_seconds >= 60` (ou 0). `shared_with_id` válido e do
  workspace.

## Reuso de defesas

- Gadgets OQL herdam **todas** as mitigações da feature 02 (não há caminho de
  query fora do whitelist).
- Gadgets de métrica herdam as restrições de scope da feature 08.

## Auditoria

- Criação/partilha de dashboard regista ator.
- Sem segredos em config de gadget; se um dia houver tokens (ex.: gadget de URL
  externa), encriptar e nunca devolver em claro.
