---
name: operoz-engenharia
description: >-
  Engenharia Operoz com pensamento UX/UI de classe mundial: mental model,
  hierarquia, estados, acessibilidade, copy pt-BR e design system Propel.
  Obrigatório antes de implementar qualquer tela, modal, fluxo ou componente
  visual — não só PRD review. Combinar com skills irmãs (DESIGN SISTEMA,
  DESENVOLVEDOR SENIOR, EXPERIÊNCIA JIRA).
---

# Operoz — Engenharia com UX de produto

Skill **mestre** da pasta `OPEROZ ENGENHARIA/`. Define como o agente pensa **antes de codar UI** — melhor que um designer médio: opinionado, específico ao domínio Operoz, fricção mínima.

**Regras:** `.cursor/rules/operoz-orchestrator.mdc`, `operoz-frontend-design.mdc`, `operoz-issue-ux.mdc`, `operoz-anti-patterns.mdc`  
**Skills irmãs:**

| Pasta                   | Foco                                                 |
| ----------------------- | ---------------------------------------------------- |
| `DESIGN SISTEMA/`       | Tokens Tailwind, telas irmãs, densidade Linear/Plane |
| `DESENVOLVEDOR SENIOR/` | Backend, segurança, performance, diff mínimo         |
| `EXPERIÊNCIA JIRA/`     | Issues, Kanban, layout 70/30, squads                 |
| `ANTI_PATTERNS.md`      | Proibições técnicas (N+1, IDOR, `any`)               |

**Harness (PRD review guest):** `.cursor/skills/harness-engineering/prd-review-client-upload.md` — aplicar **este** raciocínio UX ao modal de convites, estados de sessão e copy guest.

---

## Quando activar

- Criar ou alterar **qualquer** UI: página, modal, drawer, tabela, filtro, banner, empty state, toast, fluxo de convite/link.
- Revisar PRD review, Client 360, board hub, páginas, assistente.
- Pedido explícito de «melhorar UX», «polish», «modal», «copy».

Indicar no início: _«Operoz Engenharia | UX: … | Skill: DESIGN SISTEMA se tokens»_.

---

## Loop obrigatório (antes de escrever JSX)

```text
1. Job-to-be-done     → o que o utilizador quer concluir?
2. Mental model       → o que já sabe? o que espera ver?
3. Hierarquia         → essencial primeiro; resto em disclosure
4. Estados            → vazio / loading / erro / sucesso / parcial
5. Referências        → telas irmãs no repo (grep, client-360, modais)
6. Decisões (3–5)     → layout, copy pt-BR, edge cases — em bullets
7. Implementar        → Propel + tokens; checklist final
```

**Não saltar passos 1–6** mesmo para «só um botão» ou «fix pequeno».

---

## 1. Mental model & jobs-to-be-done

Perguntas obrigatórias:

| Pergunta                              | Exemplo ruim → bom                                              |
| ------------------------------------- | --------------------------------------------------------------- |
| O que o utilizador quer **concluir**? | «Criar invite via API» → «Convidar o cliente a rever o PRD»     |
| Em que **contexto** está?             | Board admin a partilhar link guest vs. guest a aprovar PRD      |
| O que acontece **a seguir**?          | E-mail enviado + link na clipboard; lista de convites permanece |
| Pode **desfazer** ou repetir?         | Revogar convite; gerar novo se expirado (410)                   |
| Quem tem **acesso**?                  | Mostrar estado por convite (pendente, expirado, aprovado)       |

**Progressive disclosure:** metadados técnicos (UUID, token, URL longa, JSON) **nunca** são o foco primário. Mostrar título humano, estado, actor, data; detalhes técnicos sob «Copiar link», tooltip ou secção colapsável.

---

## 2. Hierarquia, escaneabilidade & affordances

### Hierarquia de informação

1. **Primário** — acção ou decisão do fluxo (título modal, CTA, estado do recurso).
2. **Secundário** — contexto que ajuda decidir (descrição curta, quem foi convidado, prazo).
3. **Terciário** — metadados, IDs, timestamps relativos (`text-11 text-tertiary`).

### Escaneabilidade (Operoz denso)

- Títulos: `text-16 font-semibold text-primary` (modal) ou `text-13 font-medium`.
- Corpo: `text-12` / `text-13 text-secondary`; legendas `text-11 text-tertiary`.
- Listas densas: `divide-y divide-subtle`, não card flutuante por linha.
- Alinhamento de acções: primária à direita no modal; destrutiva com `variant="danger"`.

### Affordances

- Controlos clicáveis parecem clicáveis: hover `bg-layer-*-hover`, `cursor-pointer`, foco visível.
- Ícones **sem** texto visível → `Tooltip` + `aria-label` (padrão abaixo).
- Desabilitado: `disabled` + explicação (tooltip ou copy) — não botão morto sem contexto.
- Links externos: ícone + título legível; URL truncada com tooltip, não parágrafo `break-all`.

---

## 3. Estados de interface (obrigatório em todo fluxo)

Planear **todos** antes de implementar:

| Estado      | Padrão Operoz                                                                                         |
| ----------- | ----------------------------------------------------------------------------------------------------- |
| **Empty**   | Ícone `lucide` 16px, título `text-secondary`, 1 frase de valor + CTA `accent`                         |
| **Loading** | Skeleton `bg-layer-2 animate-pulse` em listas; botão com label «A enviar…»; evitar spinner fullscreen |
| **Error**   | `setToast` `TOAST_TYPE.ERROR` + mensagem acionável; inline em formulário se campo inválido            |
| **Success** | Toast curto; **manter contexto** (não fechar modal se utilizador pode convidar mais)                  |
| **Parcial** | Ex.: convites mistos (pendente + expirado) — badge por linha, não média confusa                       |

### Fluxos com link/convite (PRD review, Client 360 guest, copy page)

| Evitar                                       | Preferir                                                        |
| -------------------------------------------- | --------------------------------------------------------------- |
| Bloco `<p>` com URL `break-all` após sucesso | Toast «Link copiado» + `IconButton` copiar na lista de convites |
| Fechar modal e perder lista                  | Manter modal/lista; permitir adicionar e-mails                  |
| URL no corpo do toast como fallback default  | Só mostrar URL no toast se clipboard falhar                     |
| Token ou UUID visível                        | «Copiar link de revisão»                                        |

Referência boa: `PageCopyLinkControl`, `Client360GuestShareButton` (copia + toast, sem URL permanente).  
Referência a melhorar: `page-review-share-modal.tsx` (URL crua em `<p>` — **anti-pattern**).

---

## 4. Copy & microcopy (pt-BR, marca Operoz)

- **Sempre** chaves i18n: `packages/i18n/src/locales/pt-BR/` + `en/` — nunca string hardcoded em feature nova.
- **Nunca** mostrar chave crua (`page_review.share_modal_title`) na UI — sinal de tradução em falta.
- Tom: directo, profissional, sem jargão de API («sessão criada» → «Convite enviado»).
- Marca **Operoz** onde fizer sentido; evitar nomes de concorrentes.
- Botões: verbo + objeto («Enviar convites», «Copiar link», «Revogar acesso»).
- Erros: o que falhou + o que fazer («Não foi possível enviar. Verifique os e-mails e tente de novo.»).
- Placeholders: exemplo real (`cliente@empresa.com`), não «Digite aqui».

---

## 5. Acessibilidade (baseline, não opcional)

- **Teclado:** `ModalCore` fecha com Escape; ordem de tab lógica (campos → cancelar → primário).
- **Foco:** primeiro campo focável ao abrir modal; trap de foco no modal.
- **Labels:** `<label>` associado a inputs; `aria-label` em `IconButton`.
- **Contraste:** só tokens semânticos (`text-primary` sobre `bg-surface-1`) — sem hex ad hoc.
- **Anúncios:** toasts para sucesso/erro de acções assíncronas; loading no botão activo.
- **Touch:** alvos ≥ 32px; `isMobile` em tooltips quando o componente Propel suportar.

---

## 6. Design system Operoz (implementação)

Detalhe completo: `DESIGN SISTEMA/SKILL.md` e `operoz-frontend-design.mdc`.

### Tokens (resumo)

```tsx
<div className="bg-canvas">           {/* raiz — uma vez */}
<div className="bg-surface-1">        {/* página / modal body */}
<div className="bg-layer-1 border border-subtle rounded-md">
<p className="text-secondary text-13" />
<span className="text-tertiary text-11" />
```

### Componentes Propel / UI (ordem de preferência)

1. `@operis/propel` — `Button`, `Input`, `IconButton`, `Tooltip`, `Badge`, toast
2. `@operis/ui` — `ModalCore`, menus
3. Primitives locais — **só** se não existir equivalente

### Padrão IconButton + Tooltip

Acções compactas no header, toolbars Client 360, copiar link:

```tsx
<Tooltip tooltipContent={isCopied ? t("copied") : t("copy_link")} position="bottom">
  <IconButton
    variant="ghost"
    size="lg"
    icon={isCopied ? CheckIcon : LinkIcon}
    onClick={handleCopy}
    aria-label={isCopied ? t("copied") : t("copy_link")}
    className={cn(isCopied && "text-success-primary")}
  />
</Tooltip>
```

Referências: `copy-link-control.tsx`, `client-360-ui.tsx` (filtros), `PageReviewShareButton` (header).

### Modal

- `ModalCore` + `EModalWidth.MD` / `LG`; corpo `p-6`, `gap-4`.
- Largura: `w-[min(100vw-2rem,28rem)]` — respiração lateral em mobile.
- **Não** empilhar 6+ campos sem secções; preferir wizard ou drawer para fluxos longos.

---

## 7. O que mostrar vs. esconder

| Dado                  | Superfície                                              |
| --------------------- | ------------------------------------------------------- |
| URL guest / PRD / QBR | Botão copiar + toast; opcional «Ver link» colapsável    |
| ID issue (`WEB-104`)  | `font-mono text-11 text-tertiary`; copiável secundário  |
| Token / UUID interno  | Nunca na UI principal                                   |
| Erro API técnico      | Mensagem traduzida; detalhes só em dev/log              |
| Permissões            | Esconder acção se API nega (capabilities)               |
| Custos Harness        | Formatado `R$ 1.234,56`; detalhe pipeline em disclosure |

---

## 8. Anti-patterns UX (proibidos)

| Anti-pattern                            | Porquê                                      | Alternativa                             |
| --------------------------------------- | ------------------------------------------- | --------------------------------------- |
| URL crua em `<p className="break-all">` | Feio, não escaneável, medo de «link errado» | Copiar + toast                          |
| Chave i18n visível                      | Quebra confiança                            | Corrigir locale                         |
| Modal minúsculo e cramped               | Mobile ilegível                             | `min(100vw-2rem, …rem)`, `gap-4`, `p-6` |
| Empty «Nenhum dado»                     | Zero orientação                             | Próximo passo + CTA Operoz              |
| Spinner fullscreen em lista             | Pesado                                      | Skeleton rows                           |
| Modal para acção de 1 clique            | Fricção                                     | Inline / optimistic UI (issues)         |
| Hex / `gray-*`                          | Dark mode quebrado                          | Tokens `layer` / `text-*`               |
| Duplicar `Button` local                 | Inconsistência                              | `@operis/propel`                        |
| Fechar modal após sucesso único         | Perde contexto multi-convite                | Manter lista                            |

Complemento técnico: `ANTI_PATTERNS.md`.

---

## 9. Checklist antes de entregar UI

### Produto & UX

- [ ] JTBD escrito em 1 frase; decisões de layout/copy listadas
- [ ] Empty, loading, erro e sucesso implementados (não só happy path)
- [ ] Sem URL/token/UUID cru como elemento principal
- [ ] Microcopy pt-BR + en; sem chaves i18n expostas
- [ ] Utilizador sabe «o que acontece a seguir» após acção primária

### Design system

- [ ] Telas irmãs revistas e alinhadas (`DESIGN SISTEMA`)
- [ ] Tokens canvas / surface / layer; sem hex
- [ ] `IconButton` + `Tooltip` + `aria-label` em acções só-ícone
- [ ] Modal com respiração; acções alinhadas à direita

### Acessibilidade & qualidade

- [ ] Tab order e Escape no modal
- [ ] Contraste via tokens semânticos
- [ ] `pnpm check:types` nos pacotes tocados
- [ ] Permissões alinhadas com API

---

## 10. Exemplo guiado — modal partilhar PRD review

**JTBD:** Admin Operoz convida stakeholders externos a rever PRD sem conta.

**Decisões:**

- Título + descrição curta (valor: «Recebem e-mail com link seguro»).
- Campo e-mails com placeholder exemplo; validação inline.
- Após envio: toast «Link copiado»; **lista** de convites com estado (pendente, expirado, aprovado).
- Copiar link: `IconButton` por linha — **não** parágrafo URL.
- Modal permanece aberto para mais convites; «Fechar» secundário.
- Erro 410 guest documentado: CTA «Gerar novo convite».

**Harness:** seguir MCP em `harness-engineering/prd-review-client-upload.md`; UX desta skill aplica-se ao modal e à experiência guest.

---

## Comandos úteis

```bash
cd Operis && pnpm --filter web check:types
pnpm dev
```

---

## Hierarquia com Harness

```text
Pedido utilizador
  → harness-engineering/SKILL.md (backlog, MCP, verificação)
  → OPEROZ ENGENHARIA/SKILL.md (este ficheiro — pensar UX)
  → DESIGN SISTEMA / DESENVOLVEDOR SENIOR / EXPERIÊNCIA JIRA
  → Código em Operis/
```
