# 03 — Segurança Transversal

Baseline de segurança que **toda** feature herda. As secções `04-seguranca.md`
de cada feature só descrevem o que é *específico* dela.

## 1. Autenticação e sessão

- Rotas internas usam `BaseSessionAuthentication` (já em `BaseViewSet`).
- Rotas guest (token) seguem o padrão de `Client360QbrGuestLink`: token opaco,
  TTL, revogação, escopo mínimo, cookie-less.
- API tokens por utilizador para integrações externas (escopo do workspace).

## 2. Autorização (RBAC)

- Hierarquia: **Workspace** → **Project** → **Board**.
- `ROLE`: `ADMIN(20)` > `MEMBER(15)` > `GUEST(5)` (`app/permissions/base.py`).
- Todo endpoint declara `@allow_permission([roles], level="WORKSPACE"|"PROJECT")`.
  Workspace ADMIN sobrepõe papel de projeto.
- Permissões finas de board via `BoardRolePermission(role, permission_key,
  granted)`. Novas features que precisem de granularidade reutilizam este
  mecanismo de chaves (ver feature 07).

### Checklist por endpoint

- [ ] Tem `@allow_permission`?
- [ ] O queryset filtra por workspace/projeto do request?
- [ ] Objetos referenciados no body pertencem ao mesmo workspace?
- [ ] Resposta não inclui campos de outro tenant?

## 3. Validação de input

- Validar **sempre** no serializer (`validate_<campo>`/`validate`), nunca
  confiar no cliente.
- Limites de tamanho explícitos (texto, listas, ficheiros).
- IDs no body verificados quanto a pertença ao workspace (evita IDOR).
- Datas, números e enums com tipos fortes; rejeitar valores fora do domínio.

## 4. Segredos

- Nunca em texto plano. Padrão `{{secret:key}}` resolvido em runtime
  (`automation/secrets.py`) com encriptação (`license.utils.encryption`).
- `redact_for_storage()` antes de logar/persistir qualquer payload com
  potenciais segredos.
- Segredos de integração (GitHub, Slack, CRM) guardados encriptados, nunca
  devolvidos na API em claro.

## 5. Isolamento de execução arbitrária

Aplica-se a OQL (feature 02), scripts de automação e smart commits (feature 12):

- **OQL** compila para Django `Q` objects — **nunca** SQL string. Sem acesso a
  tabelas fora do escopo; tradução whitelisted de campos.
- **Scripts** correm sob `policy.py`: `script_timeout_seconds` (default 10),
  `script_max_memory_mb` (default 128), bloqueio de imports perigosos
  (`child_process`, `fs`, `eval`…), e dentro de sandbox.
- **Webhooks de saída** validados contra `webhook_allowed_domains` (allowlist).

## 6. Rate limiting e circuit breaker

- Governança Redis (`automation/governance.py`): limites por board/workspace
  (`automation:rate:board:{id}:hour`) e circuit breaker que abre após N falhas
  (default 10).
- APIs sensíveis (pesquisa OQL, geração de relatórios, import) devem ter
  throttle próprio para evitar abuso/DoS acidental.

## 7. Auditoria

- Audit automático via `created_by`/`updated_by`/timestamps do `BaseModel`.
- Ações sensíveis (mudança de permissão, publish de workflow, execução de
  automação) registam entrada de auditoria dedicada com ator, antes/depois.
- Logs sem PII desnecessária; segredos sempre redigidos.

## 8. Multi-tenancy

- Isolamento por workspace é invariante de segurança, não conveniência.
- Testes de tenant-isolation obrigatórios para cada nova entidade (ver
  `05-estrategia-de-testes.md`).

## 9. Modelo de ameaças (STRIDE-lite) — base

| Ameaça | Mitigação base |
| --- | --- |
| **S**poofing | Sessão autenticada; tokens guest com TTL |
| **T**ampering | Validação serializer; constraints DB; soft-delete |
| **R**epudiation | Audit trail com ator e timestamps |
| **I**nfo disclosure | RBAC + filtro de workspace + serializers Lite |
| **D**enial of service | Rate-limit, circuit breaker, timeouts, paginação |
| **E**levation of privilege | `@allow_permission` por endpoint; checagem de pertença |

## 10. OWASP Top 10 — onde cada item é tratado

- **A01 Broken Access Control** → RBAC + checklist por endpoint (secção 2).
- **A03 Injection** → OQL→`Q`, ORM parametrizado, sem SQL cru (secção 5).
- **A02 Cryptographic Failures** → segredos encriptados (secção 4).
- **A04 Insecure Design** → threat-model por feature (secção 9).
- **A05 Security Misconfiguration** → policy defaults seguros (secção 5).
- **A08 Data Integrity** → constraints + audit + soft-delete.
- **A09 Logging Failures** → auditoria + redação de segredos (secção 7).
