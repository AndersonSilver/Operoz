# 04 — Segurança · Permission Scheme & Segurança

Baseline em [`00-VISAO-GERAL/03-seguranca-transversal.md`](../00-VISAO-GERAL/03-seguranca-transversal.md).
Esta feature **é** segurança; aqui foca-se em não criar buracos ao tornar o RBAC
mais granular.

## Princípio: fail-closed

> Na dúvida, **negar**. Permissão ausente = sem acesso. Um `permission_key`
> desconhecido nunca concede acesso. Default deny em todo o avaliador.

## Threat-model específico

| Ameaça | Vetor | Mitigação |
| --- | --- | --- |
| Elevação por scheme mal configurado | Grant largo demais | Scheme default conservador; preview de "quem pode o quê" antes de salvar |
| Bypass do security level | Issue restrita aparece em lista/OQL/board/dashboard | `visible_security(user)` aplicado em **todas** as queries de issue, centralizado |
| Auto-concessão | Membro edita scheme para se dar permissão | Só ADMIN gere schemes; toda alteração auditada |
| Grupo como vetor | Adicionar-se a grupo privilegiado | Gestão de grupos restrita a ADMIN; audit |
| SSO mal configurado | Assinatura SAML não validada → spoofing | Validar assinatura/cert do IdP; usar lib madura, não custom |
| 2FA bypass | Endpoint sensível sem 2FA | Exigir 2FA recente para ações críticas quando ativado |
| Audit tampering | Apagar evidência | Audit log append-only; sem endpoint de edição/delete |
| Permissão UI≠servidor | Esconder botão mas API permitir | Servidor é a única fronteira; `can()` é só UX |

## Aplicação consistente (o maior risco)

O perigo de granularidade é esquecer de aplicar a verificação nalgum endpoint.
Mitigações:

- **Catálogo único** `PERMISSION_KEYS` + decorator `@require_permission(key)`.
- Checklist obrigatório por endpoint (já em `00-VISAO-GERAL/03`).
- `visible_security()` e `has_permission()` são **funções únicas** reutilizadas —
  um só sítio a auditar, não N cópias.
- Teste automatizado que percorre as rotas e falha se uma rota de issue não
  aplica `visible_security`.

## SSO / SAML / OIDC

- Validar assinatura, `audience`, `notOnOrAfter`, replay (cache de assertion id).
- Mapear claims → utilizador/grupos de forma explícita (não confiar em claims
  arbitrárias para conceder admin).
- Config por instance (superuser), encriptada.

## 2FA

- TOTP (RFC 6238) com janela curta; códigos de recuperação encriptados e
  one-time. Rate-limit nas tentativas de verificação.

## Auditoria

- `AuditLogEntry` para: mudança de scheme/grant, criação/edição de grupo,
  atribuição de role, mudança de security level, config SSO/2FA, publish de
  workflow (feature 01).
- Append-only; retenção configurável (reusar padrão de retenção do Cliente 360).

## Rollback

- Scheme default reproduz comportamento atual: a feature pode ser introduzida
  sem alterar acessos até que um admin configure schemes específicos.
