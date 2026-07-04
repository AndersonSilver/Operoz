---
name: security-audit
description: Faz auditoria de segurança em código, endpoints ou fluxos de autenticação/autorização, cobrindo OWASP Top 10 para web. Use quando o usuário pedir "revisão de segurança", "pentest básico", "isso é seguro?", ou antes de expor uma feature nova que lida com dados sensíveis ou input externo.
---

# Auditoria de Segurança Web

Percorra sistematicamente as categorias abaixo no código/fluxo em questão. Para cada
achado, classifique severidade (crítico / alto / médio / baixo) com base no impacto
real (dado exposto, tipo de usuário afetado, facilidade de exploração) — não trate
tudo como crítico.

## 1. Injeção (SQL, NoSQL, comando)

- Toda query usa parametrização/ORM? Procure concatenação de string com input do
  usuário em queries.
- Comandos de shell/sistema constroem argumento a partir de input do usuário sem
  sanitização?

## 2. Autenticação quebrada

- Senha armazenada com hash forte (bcrypt/argon2/scrypt), nunca MD5/SHA1 puro nem
  texto plano.
- Rate limiting em login/reset de senha (proteção contra brute-force).
- Mensagens de erro de login não revelam se o problema foi usuário inexistente vs
  senha errada (evita enumeração de usuários).
- Reset de senha usa token de uso único com expiração curta, não previsível.

## 3. Controle de acesso quebrado (autorização)

- **IDOR**: para cada endpoint que recebe um ID de recurso, existe verificação de
  que o usuário autenticado tem permissão sobre _aquele_ recurso específico (não só
  "está logado")?
- Escalação de privilégio: um usuário comum consegue, manipulando request, acessar
  ação de admin?
- Autorização verificada no backend, não só escondida na UI do frontend.

## 4. Exposição de dados sensíveis

- Dados sensíveis (senha, token, PII completo) aparecem em log, resposta de erro,
  ou payload de API que não precisava incluí-los?
- Transporte sempre HTTPS; sem dado sensível em query string (fica em logs de
  acesso/histórico).
- Dados em repouso sensíveis (PII, dados de pagamento) criptografados quando o
  contexto regulatório/de risco exige.

## 5. XSS (Cross-Site Scripting)

- Input do usuário renderizado como HTML sem escape (`dangerouslySetInnerHTML`,
  `innerHTML`, template não escapado)?
- Content-Security-Policy configurado para limitar origem de scripts?

## 6. CSRF

- Mutações que dependem de cookie de sessão têm proteção CSRF (token, ou
  `SameSite=Strict/Lax` no cookie)?

## 7. Configuração incorreta de segurança

- Headers de segurança presentes: `Content-Security-Policy`, `X-Content-Type-Options:
nosniff`, `Strict-Transport-Security`.
- Modo debug/stacktrace detalhado desligado em produção (não vaza estrutura interna
  em erro 500).
- CORS configurado com origem explícita, não `*` em endpoint que aceita credenciais.

## 8. Componentes vulneráveis

- Dependências desatualizadas com CVE conhecida (rode `npm audit`/equivalente).
- Pacote novo adicionado é mantido ativamente e vem de fonte confiável?

## 9. SSRF

- Requisição de servidor para URL fornecida pelo usuário valida/restringe destino
  (bloqueia IP interno, endpoint de metadata de cloud)?

## 10. Logging e monitoramento

- Eventos de segurança relevantes (login falho repetido, mudança de permissão,
  acesso a dado sensível) são logados de forma auditável?
- Existe alerta para padrão anômalo (muitas falhas de login, muitos 403 do mesmo
  IP)?

## Formato do relatório

Para cada achado: categoria OWASP, severidade, onde está (arquivo/endpoint),
cenário de exploração em 1-2 frases, e correção recomendada. Termine com um resumo
priorizado: o que corrigir primeiro se só houver tempo para uma coisa.
