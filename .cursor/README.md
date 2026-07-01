# Kit de Dev Sênior Web — Cursor + Claude Code

Conjunto de regras (Cursor) e skills (Claude Code / claude.ai) que encodam práticas
de engenharia web sênior fullstack: frontend, backend, testes, segurança, infra e
fluxo de git.

## Estrutura

```
senior-web-dev-kit/
├── CLAUDE.md                          # memória/instruções para Claude Code
├── .cursor/rules/                     # regras do Cursor (.mdc)
│   ├── 00-persona-senior.mdc          # sempre ativa
│   ├── 10-frontend.mdc                # ativa em .tsx/.jsx/.css/components
│   ├── 20-backend.mdc                 # ativa em api/server/controller/service
│   ├── 30-testing.mdc                 # ativa em .test./.spec./e2e
│   ├── 40-security.mdc                # sempre ativa
│   ├── 50-infra-devops.mdc            # ativa em Dockerfile/CI/Terraform/k8s
│   └── 60-git-workflow.mdc            # sempre ativa
└── skills/                            # skills do Claude Code / claude.ai
    ├── code-review/SKILL.md
    ├── architecture-decisions/SKILL.md
    ├── api-design/SKILL.md
    ├── performance-optimization/SKILL.md
    ├── security-audit/SKILL.md
    ├── testing-strategy/SKILL.md
    └── deployment-checklist/SKILL.md
```

## Como instalar no Cursor

1. Copie a pasta `.cursor/rules/` inteira para a raiz do seu repositório (junto ao
   `.git`).
2. O Cursor carrega automaticamente:
   - Regras com `alwaysApply: true` em toda conversa/edição.
   - Regras com `globs` só quando você está editando um arquivo que casa com o
     padrão (ex. `10-frontend.mdc` só entra em ação em `.tsx`/`.jsx`/componentes).
3. Não precisa de configuração adicional — o Cursor lê `.cursor/rules/*.mdc`
   nativamente. Se seu projeto já tem regras em `.cursor/rules/`, apenas copie os
   arquivos novos para dentro da mesma pasta (os prefixos numéricos evitam conflito
   de nome).

## Como instalar no Claude Code

1. Copie a pasta `skills/` para dentro do seu projeto (ex. `<repo>/skills/`) — ou
   para `~/.claude/skills/` se quiser que fiquem disponíveis em todos os projetos,
   dependendo de como o seu setup do Claude Code está organizado.
2. Copie/mescle o conteúdo de `CLAUDE.md` com o `CLAUDE.md` do seu projeto (se já
   existir um, adicione as seções relevantes em vez de sobrescrever). Preencha a
   seção "Como este projeto está estruturado" com detalhes reais do seu repo —
   isso reduz muito o trabalho do Claude em cada sessão nova.
3. As skills são carregadas automaticamente pelo Claude quando o pedido do usuário
   casa com a `description` de cada uma (ex. pedir "revisa esse PR" aciona
   `code-review`).

## Como usar no claude.ai (sem Claude Code)

Nesse ambiente as skills também funcionam da mesma forma — basta que os arquivos
`SKILL.md` estejam disponíveis no ambiente/projeto configurado. Se você quiser usar
avulso, pode colar o conteúdo de um `SKILL.md` específico no início da conversa
como instrução de contexto.

## Personalizando

- Ajuste `.cursor/rules/*.mdc` para refletir convenções específicas do seu time
  (ex. framework de teste específico, biblioteca de UI, provedor de cloud).
- Adicione novos skills seguindo o mesmo formato (frontmatter `name` +
  `description` pushy sobre quando usar, corpo com processo/checklist).
- Se dois arquivos `.mdc` tiverem globs sobrepostos (ex. um arquivo de teste dentro
  de `components/`), ambas as regras se aplicam — isso é esperado e desejável.

## Mantendo atualizado

Trate esses arquivos como código: versione no repositório, revise em PR quando
alguém propuser mudança de padrão, e evite deixá-los genéricos demais — quanto mais
específico ao seu stack real, mais úteis ficam.
