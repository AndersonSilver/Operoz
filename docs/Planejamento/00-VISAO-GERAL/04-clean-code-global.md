# 04 — Clean Code Global

Diretrizes de qualidade aplicáveis a todo o programa. As features referenciam
este documento; o `05-clean-code-e-testes.md` de cada uma só acrescenta o que é
específico.

## 1. Nomenclatura

- **Python:** `snake_case` para funções/variáveis, `PascalCase` para classes,
  `UPPER_SNAKE` para constantes. Modelos no singular (`Worklog`), tabelas no
  plural (`worklogs`).
- **TypeScript:** `camelCase` para variáveis/funções, `PascalCase` para
  componentes/tipos/classes. Tipos de domínio com prefixo `T` (`TWorklog`),
  interfaces de store com `I` (`IWorklogStore`).
- Nomes revelam intenção: `time_spent_seconds` > `tss`; `getWorklogsByIssue` >
  `getData`. Evitar abreviações e nomes genéricos (`data`, `info`, `manager`).

## 2. Funções e responsabilidade única

- Função faz **uma** coisa. Se o nome precisa de "e" (`validate_and_save`),
  provavelmente são duas.
- Alvo: funções curtas (idealmente < 30 linhas); complexidade ciclomática baixa.
- Lógica de negócio em **serviços/funções de domínio**, não em views nem
  serializers nem componentes. Views orquestram; serializers (de)serializam;
  componentes renderizam.
- Evitar parâmetros booleanos de controlo de fluxo — preferir funções
  separadas ou enums.

## 3. SOLID aplicado ao Operoz

- **S**ingle responsibility: store de domínio, service de domínio, viewset de
  recurso.
- **O**pen/closed: estender via catálogo de nós (automação) e registries, não
  editando o executor.
- **L**iskov: serializers Lite são substituíveis onde se espera o tipo base.
- **I**nterface segregation: stores expõem só o que a UI usa; services por
  domínio.
- **D**ependency inversion: store recebe service por construtor; fácil de
  mockar em teste.

## 4. DRY e reuso

- Antes de escrever, procurar o que já existe: `BaseModel`, `APIService`,
  canvas React Flow, paginação, `@operoz/ui`.
- Não copiar-colar lógica entre features; extrair helper partilhado
  (`utils/`, `@operoz/utils`).
- Documentação também é DRY: features referenciam `00-VISAO-GERAL`, não repetem.

## 5. Comentários

- Código auto-explicativo > comentário. Comentar **porquê**, não **o quê**.
- Comentar apenas invariantes não óbvias (ex.: "advisory lock para sequence_id
  atómico"). Sem comentários que narram a linha seguinte ou referem o autor/PR.

## 6. Tratamento de erros

- Backend: deixar `BaseViewSet` mapear exceções conhecidas; lançar
  `ValidationError` com mensagem útil. Nunca `except: pass`.
- Frontend: erros de service propagados e tratados na action do store; UI
  mostra estado de erro via toast/empty-state, sem engolir.

## 7. Tamanho e organização de ficheiros

- Um modelo por ficheiro em `db/models/`; um viewset por recurso.
- Componentes React pequenos e compostos; extrair sub-componentes quando o JSX
  passa de ~150 linhas.
- Barrel exports (`index.ts`) por pasta de feature no frontend.

## 8. Lint e formatação (gate obrigatório)

- **Frontend:** `oxlint` + `oxfmt` (`pnpm check:lint`, `pnpm check:format`).
- **Backend:** seguir o linter Python do projeto (ruff/flake8 conforme config).
- **Tipos:** `pnpm check:types` deve passar (TypeScript strict).
- Nada entra sem lint, format e types verdes.

## 9. Commits e PRs

- Commits no estilo do repo: `feat(worklog): ...`, `fix(api): ...`,
  `docs: ...`. Mensagem explica o porquê.
- PR pequeno e vertical (uma fatia da feature) > PR gigante.

## 10. Definition of Done (por fatia)

- [ ] Modelo + migração + constraints/índices.
- [ ] API com `@allow_permission` e validação no serializer.
- [ ] Frontend: store + service + componente + rota + i18n.
- [ ] Testes unit (pytest) + e2e (Playwright) do caminho feliz e de um erro.
- [ ] Lint/format/types verdes.
- [ ] Sem segredos em claro; sem query sem filtro de workspace.
