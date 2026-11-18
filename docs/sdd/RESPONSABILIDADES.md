# Responsabilidades e handoffs

Os papéis abaixo são responsabilidades de trabalho, não contas ou agentes que precisam existir em paralelo. Uma mesma pessoa pode assumir vários, mas cada decisão e evidência tem um dono identificado na especificação.

| Responsabilidade | Decide/entrega | Recebe de | Entrega para | Não decide |
| --- | --- | --- | --- | --- |
| Produto/operação Enpulse | Regras de corte, reenvio, ajuste, SLA, destinatários e aceite da jornada | necessidades dos clientes e da base | especificação de negócio aprovada | detalhes de RLS ou CSS |
| Domínio/arquitetura | Glossário, estados, invariantes, contratos e ADRs difíceis de reverter | produto/operação | dados, aplicação e experiência | volume final de um pedido real |
| Identidade e autorização | Cadastro, sessão, papéis, vínculo e matriz de permissão | domínio, TI Enpulse | dados, aplicação e QA | regra de volume ou layout |
| Dados/Supabase | Migrações, constraints, RLS, funções transacionais, backfill e consultas de verificação | domínio e identidade | aplicação, QA e publicação | significado de ajuste sem produto |
| Aplicação | Rotas, casos de uso, validação de entrada, idempotência e tratamento de falhas | contratos e migrações | experiência e QA | prazo oficial calculado no navegador |
| Experiência/design | Fluxo, componentes visuais, conteúdo, responsividade e acessibilidade | produto e contratos | QA e operação | permissão apenas por ocultar botão |
| QA/segurança | Cenários, testes positivos/negativos, concorrência, contraste e evidência | todas as entregas | publicação | aceitar exceção de negócio sem dono |
| Publicação/operação técnica | Ambiente, segredos, rollout, observabilidade, backup e reversão | QA e operação | usuários finais e suporte | alterar regra de negócio durante corte |

## Handoff mínimo por fatia

1. **Produto → domínio:** exemplos reais anonimizados, resultado desejado, exceções e decisão registrada. Fica pronto quando o comportamento pode ser expresso em cenários de aceite.
2. **Domínio/identidade → dados/aplicação:** estados, invariantes, matriz de acesso e contrato de entrada/saída. Fica pronto quando dois implementadores independentes chegam ao mesmo resultado para os casos principais e de erro.
3. **Dados → aplicação/QA:** migração, grants, RLS, função e consulta de verificação com evidência em ambiente isolado. Fica pronto quando clientes A/B e papéis internos foram exercitados sem chave privilegiada.
4. **Aplicação/experiência → QA:** jornada completa e estados visualizados. Fica pronto quando todos os cenários da especificação funcionam em desktop e celular.
5. **QA → publicação:** resultados, riscos remanescentes, rollback e critérios de monitoramento. Fica pronto quando uma pessoa de operação consegue aprovar o comportamento e a equipe técnica consegue reverter o tráfego.

## Mudança de Supabase

O responsável de dados executa o [runbook](SUPABASE.md). Cada migração tem dono, ambiente, evidência anterior/posterior e consulta de verificação. A publicação altera a Data API/produção somente depois de RLS, grants e testes negativos. A aplicação troca a rota depois que a migração e a reconciliação estão confirmadas.
