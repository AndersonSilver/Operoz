# Tech4Humans — Organização no Plane (referência)

Documento de apoio à equipa. Resume como o Plane modela trabalho, opções de organização por times e limitações do produto. **Não implica alterações de código** por si só.

---

## 1. Hierarquia Tech4Humans (canónica)

**Ordem fixa acordada para a equipa:**

```text
Workspace → Board (time) → Projeto (épico) → Card → Subtarefa → Subtarefa …
```

| Conceito Tech4Humans | No Plane (UI em PT) |
|----------------------|----------------------|
| Workspace / empresa | **Espaço de trabalho** — ex.: Tech4Humans |
| Board / time | **Board** *(a implementar no fork)* |
| Projeto / **épico de negócio** | **Projeto** — o épico **não** é o Módulo |
| Card | **Item de trabalho** (issue) |
| Subtarefa | **Sub-item** (pode aninhar) |

**Módulos** e **Ciclos** no Plane continuam úteis *dentro* de um projeto (marco, sprint), mas ficam **abaixo** do épico/projeto, não entre Board e Projeto.

Fluxo típico: criar **Board (time)** → **Projeto (épico/cliente)** → **Itens (cards)** → **Sub-itens**; usar **Módulos** só se precisarem de agrupar cards dentro do mesmo épico.

---

## 1.1 Hierarquia antiga do Plane (referência stock, antes do Board)

| Conceito habitual | No Plane stock (sem Board) |
|-------------------|----------------------------|
| Instância / empresa | Workspace |
| Projetos de negócio | Projetos |
| Épicos / temas *no projeto* | Módulos |
| Cards | Itens de trabalho |
| Subtarefas | Sub-itens |

---

## 2. Vista «Itens» mostra tudo?

Sim. **Itens** é a vista ao nível do **projeto**: por defeito aparecem **todos os itens** desse projeto, **independentemente do módulo** (misturados na mesma lista ou quadro), salvo filtros.

Para não ver tudo de uma vez:

- **Filtros** — por exemplo filtrar por **módulo**.
- **Módulos** — abrir um módulo concreto e trabalhar o que está ligado a esse módulo.
- **Visualizações** — guardar vistas com filtros (ex.: só um módulo, só backlog).

---

## 3. Organização por círculos / times (vários times, cada um com vários projetos)

O Plane **não** expõe um nível fixo **Time → N projetos** entre workspace e projeto.

### Opção A — Um workspace, vários projetos (recomendado na maioria dos casos)

- **Workspace** = empresa (ex.: Tech4Humans).
- Cada **projeto de negócio** = um **Projeto** no Plane.
- Identificar o **time** no **nome** (prefixo) ou convenção, por exemplo:
  - `[Impl. Esteira] Cliente X`
  - `[Webapp] Portal Y`
- Complementar com **favoritos**, **visualizações** e, se útil, **etiquetas** nos itens.

### Opção B — Um workspace por time

- Separação forte (dados e permissões).
- **Contras:** quem está em vários times muda de workspace com frequência; mais gestão de convites e possível duplicação de fluxos.

### Opção C — «Time» = um único projeto contentor

- Um projeto «Implantação Esteira» e todo o trabalho lá dentro como módulos e itens.
- **Risco:** misturar «equipa» com «projeto de cliente» e listas de itens muito grandes. Só faz sentido se a realidade for uma única iniciativa com subdivisões claras.

---

## 4. «Board por time, com projetos dentro» — existe no Plane?

**Não** como hierarquia nativa **Workspace → Board → Projetos**.

Aproximações possíveis:

1. **«Board» = um Projeto por time** — dentro desse projeto, iniciativas menores viram **módulos** + **itens** (não são sub-projetos reais no modelo de dados).
2. **Vários projetos no workspace** com **prefixo do time** no nome + **visualizações** — o «board» é organização mental ou filtros, não um nível extra na base de dados.

**Equipas nativas:** depende da edição do produto; em forks, o bloco de equipas na sidebar pode estar desativado ou vazio — não contar com isso sem desenvolvimento explícito.

---

## 5. Implementar «Board → Projetos» no código (futuro)

**Decisão de produto:** tratar como feature grande se for necessário um modelo real (não só convenção de nomes).

Envolve tipicamente:

- **Base de dados** — novo conceito (ex.: pasta ou board) e relação dos projetos com esse pai; **migrações** para projetos existentes.
- **API** — CRUD, listagens, validações.
- **Permissões** — herança ou regras entre workspace, board e projeto.
- **Web** — rotas, sidebar, estado da aplicação; alinhar outros clientes se existirem.

Ordem de grandeza: **semanas** de trabalho para uma implementação sólida, não um refactor de um dia.

**Alternativa mais leve:** agrupamento **só na UI** sem novo pai na base de dados (complexidade média), sem ser «board com projetos» a sério.

---

## 6. Self-host com código alterado (nota)

Para correr **o vosso fork** num servidor:

- O código que o VPS executa deve ser o **vosso** (clone do vosso repositório, ou imagens Docker **buildadas** a partir desse código).
- Não é obrigatório «publicar o Plane no GitHub» em abstracto: é preciso uma **fonte de verdade** (Git ou artefactos) acessível no ambiente de deploy.

---

*Documento interno Tech4Humans — alinhamento com o modelo do Plane.*
