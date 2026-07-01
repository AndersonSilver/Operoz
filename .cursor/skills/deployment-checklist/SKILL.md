---
name: deployment-checklist
description: Checklist de pré-deploy e pós-deploy para releases web em produção, cobrindo migrations, feature flags, rollback e monitoramento. Use quando o usuário mencionar "vou fazer deploy", "subir para produção", "release", ou pedir ajuda para planejar uma mudança de risco em produção.
---

# Checklist de Deploy para Produção

## Antes do deploy

- [ ] Todos os testes (unit, integração, e2e relevantes) passando em CI, não só
      localmente.
- [ ] Migrations de banco são reversíveis, ou têm plano de rollback documentado.
      Migration destrutiva (drop de coluna/tabela) só depois que o código que a usa
      já não está mais em produção há pelo menos um deploy.
- [ ] Mudança de contrato de API é backward-compatible, ou consumidores foram
      avisados/migrados antes.
- [ ] Variáveis de ambiente/segredos novos já existem no ambiente de destino antes
      do deploy (não descobrir em produção que falta uma env var).
- [ ] Feature de risco está atrás de feature flag, permitindo desligar sem novo
      deploy se algo der errado.
- [ ] Dependências novas foram auditadas (licença compatível, sem CVE crítica
      conhecida).
- [ ] Plano de rollback está claro: qual é o comando/processo exato para voltar à
      versão anterior, e quanto tempo isso leva.

## Durante o deploy

- [ ] Rollout gradual quando o risco justifica (canary, blue-green, % de tráfego),
      em vez de 100% de uma vez.
- [ ] Monitorar métricas-chave em tempo real durante o rollout: taxa de erro,
      latência, uso de recurso (CPU/memória) — não só assumir que "subiu, então
      está bem".
- [ ] Critério de abort claro e definido antes de começar: "se taxa de erro passar
      de X%, revertemos automaticamente/manualmente".

## Depois do deploy

- [ ] Smoke test dos fluxos críticos em produção (não confiar só em métrica
      agregada — checar manualmente o caminho mais importante).
- [ ] Observar dashboards e logs pelos primeiros minutos/horas (o período depende
      do tráfego do produto) antes de considerar o deploy "seguro".
- [ ] Comunicar ao time/stakeholders relevantes que o deploy aconteceu, o que mudou,
      e onde acompanhar se algo parecer errado.
- [ ] Se algo deu errado: rollback primeiro, investigação da causa raiz depois — não
      inverta essa ordem tentando debugar em produção sob pressão.

## Pós-incidente (se algo deu errado)

- [ ] Postmortem sem culpa individual, focado em: o que os processos/checks
      deixaram passar, e o que muda no checklist/pipeline para pegar isso da
      próxima vez.
- [ ] Ação concreta adicionada ao pipeline (teste novo, alerta novo, gate novo no
      CI) — postmortem sem mudança de processo tende a repetir o mesmo incidente.
