# 03 — Fila, análise e confirmação Enpulse

**Estado:** implementação local parcial; aprovação do cliente para ajustes pendente de decisão.
**Atores:** leitura, operador, gestor e administrador Enpulse; cliente em acompanhamento.
**Dependências:** `01-identidade-e-acesso.md`, `02-pedido-e-reenvio.md`.

## Resultado

A operação acompanha todos os pedidos autorizados na mesma fila, prioriza exceções, registra análise e confirma ou recusa com autoria. Cliente acompanha a decisão, sem perda do volume que solicitou.

## Cenários de aceite

1. Dado vários pedidos para o dia, quando a Enpulse filtra por base/status/prazo, então indicadores, totais e lista usam os mesmos filtros e o mesmo pedido vigente por cliente.
2. Dado pedido recebido, quando operador assume, então muda para `em_analise`, com autor e horário em evento auditável.
3. Dado volume confirmado diferente do solicitado, quando a proposta é salva, então o motivo é obrigatório e os dois valores permanecem consultáveis.
4. Dado gestor autorizado, quando confirma, então status, itens confirmados, evento e notificação pendente são gravados na mesma transação.
5. Dadas duas pessoas com a mesma versão do pedido, quando a primeira conclui, então a segunda recebe `409`, revê a versão atual e não sobrescreve o trabalho anterior.
6. Dado papel de leitura ou base fora do escopo, quando tenta mutação direta, então recebe `403` e nenhum dado muda.
7. Dado pedido recusado, quando cliente consulta o detalhe, então vê status, motivo público e data da decisão; comentário interno não aparece.
8. Dada falha do e-mail, quando confirmação já foi gravada, então cliente vê o resultado no portal e a outbox permite reenvio sem duplicar evento.

## Invariantes e contratos

- Transições seguem máquina de estados do plano e exigem versão esperada. Pedido substituído não recebe confirmação por engano.
- `volume_solicitado` nunca é sobrescrito. Divergência gera motivo e autor. Comentário interno e motivo público são campos distintos.
- Resumo operacional deriva da mesma consulta/filtro da fila; total solicitado, confirmado e previsão nunca se somam no mesmo indicador.
- Exportação registra quem, quando e quais filtros; é paginada/assíncrona quando volume exigir.
- Eventos são append-only. A notificação representa consequência de evento confirmado, não fonte do estado.

## Dados e autorização

`pedidos`, `pedido_itens`, `pedido_eventos`, `notificacoes_outbox` e papéis Enpulse. RLS limita leitura por bases e papel; função transacional controla status e versão. `service_role` não autoriza uma rota de confirmação em nome de usuário. Testes cobrem cliente A/B, anônimo e cada papel interno.

## Experiência

Fila com indicadores clicáveis, filtros visíveis, tabela em desktop e cartões no celular. Detalhe compara solicitado/confirmado e mostra timeline. Ação de confirmação exige revisão final; conflito de versão oferece atualização sem descartar entrada do operador. Estados vazios e de erro seguem o design system.

## Observabilidade e reversão

Medir tempo de recebimento até análise/confirmação, pedidos após corte, conflitos, recusas, divergências e falha de notificação. Em publicação, reverter interface/rota sem apagar decisões já gravadas; reconciliar quaisquer ações executadas durante o incidente.

## Decisões pendentes

- Enpulse ainda não definiu se ajuste exige aprovação do cliente. Se sim, especificar estado `aguardando_cliente`, prazo, aceitação, recusa e expiração antes de implementar a confirmação final. Dono: operação Enpulse.
- Papéis exatos de confirmação/recusa e SLA. Dono: gestão Enpulse.
- Separação entre comentário interno e justificativa visível ao cliente. Dono: operação Enpulse.

## Evidências locais

- A fila filtra por data, base e situação, exclui versões substituídas e pagina 50 registros; o detalhe mostra solicitado, previsão e confirmado. Operador/gestor assumem, gestor confirma ou recusa com controle de versão.
- `pnpm test` verifica bloqueio de leitura, conflito de versão, motivo obrigatório para ajuste, evento atômico, outbox, reserva da notificação e exportação auditada. O envio efetivo do e-mail e a validação visual no ambiente alvo continuam pendentes.
