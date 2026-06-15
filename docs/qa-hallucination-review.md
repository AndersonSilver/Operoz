# QA — Revisão manual de alucinações (Assistente Operoz)

Meta do programa: **taxa de alucinação &lt; 15%** em amostra manual quinzenal.

## Ritual (quinzenal)

1. Selecionar **20 respostas** aleatórias do período (admin workspace).
2. Para cada resposta, verificar:
   - Citações batem com dados reais (issue, página, run)?
   - Números e datas conferem com tools/RAG?
   - Ação proposta respeita permissões?
3. Classificar veredito via API ou UI em `Configurações → Assistente Operoz`.

## Vereditos

| Veredito        | Quando usar                                |
| --------------- | ------------------------------------------ |
| `ok`            | Resposta correta e fundamentada            |
| `hallucination` | Facto inventado ou citação inexistente     |
| `incomplete`    | Parcialmente certa, falta contexto crítico |
| `unsafe`        | Sugestão destrutiva ou fora de política    |

## API

```bash
# Registar revisão
curl -X POST .../api/workspaces/operoz/assistant/quality/reviews/ \
  -H "Authorization: Bearer ..." \
  -d '{"verdict":"hallucination","message_id":"<uuid>","notes":"Prazo inventado"}'

# Dashboard agrega hallucination_rate vs meta 15%
curl .../api/workspaces/operoz/assistant/quality/?days=14
```

## Checklist rápido (por resposta)

- [ ] Tools chamadas fazem sentido para a pergunta?
- [ ] Links/citações abrem entidade correta?
- [ ] Não há IDs ou nomes que não existem no workspace?
- [ ] Tom e limitações do assistente respeitados?
