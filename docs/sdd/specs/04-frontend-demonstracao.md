# Frontend de validação do ciclo de bombeio

**Estado:** implementação técnica concluída; validação de negócio pendente

**Responsável pela decisão de negócio:** operação Enpulse
**Dependências:** [revisão da reunião e plano de frontend](../../plataforma/REVISAO_REUNIAO_E_PLANO_FRONTEND.md)

## Objetivo e atores

Cliente e integrante Enpulse percorrem o pedido, a análise, a devolutiva e o acompanhamento em um protótipo com dados fictícios. O cliente observa apenas a persona Distribuidora Aurora; o integrante observa a fila completa. Nenhum usuário real é autenticado nesta demonstração, e nenhuma decisão nela tem efeito operacional.

## Cenários de aceite

1. Dado um ciclo de dia útil aberto, quando o cliente preenche volumes para D+1, revisa e confirma, então recebe protocolo simulado e vê o pedido em seu histórico.
2. Dada uma previsão vazia e outra explicitamente `0 m³`, quando o pedido é revisado, então a primeira aparece como “não informada” e a segunda como zero.
3. Dada a programação de sexta, quando o cenário é selecionado, então sábado, domingo e segunda aparecem separadamente; a quantidade de bombeios pode ser explorada sem afirmar uma alocação aprovada.
4. Dada uma janela encerrada, quando o cliente tenta criar pedido, então a interface bloqueia a confirmação e explica o corte.
5. Dado um pedido com dado operacional ausente ou vencido, quando o analista abre a bancada, então não há sugestão para aquele item e a decisão exige justificativa.
6. Dado um ajuste de volume, quando o analista registra a decisão, então solicitado e decidido permanecem distintos, com motivo visível ao cliente.
7. Dada uma decisão, quando a devolutiva falha no cenário, então a decisão permanece; os marcos externos não avançam até a comunicação ser marcada como enviada.
8. Dado um reenvio, quando um novo pedido é registrado para a mesma data, então a fila considera apenas a versão vigente e o histórico preserva a anterior.
9. Dado um deploy de produção, quando `/demo` é acessado, então responde 404. Em Preview, a rota só abre com `ENPULSE_ENABLE_DEMO=true`.

## Invariantes

- A marca “Demonstração — dados fictícios” permanece visível em todas as rotas.
- Nenhuma ação da demonstração usa API, Supabase, e-mail ou Petrobras; a memória se reinicia ao recarregar.
- A sugestão é ilustrativa. Saldo dividido por saída média exibe cobertura, sem definir a fórmula de corte.
- Valores usam m³, data alvo e fuso de Brasília; previsão ausente não vira zero.

## Contratos

`PlatformGateway` em `lib/plataforma/types.ts` concentra leitura e ações. `MockPlatformGateway` implementa o contrato para o protótipo. O frontend mostra estados de pedido, qualidade dos dados, comunicação e acompanhamento externo separadamente. A implementação real precisará revalidar identidade, janela, valores, versão, regra quantitativa e autorização no servidor.

## Dados e autorização

Não há migração nem acesso ao Supabase nesta fatia. Os dados são fixtures sintéticas. A separação entre personas é apenas visual; o protótipo não constitui mecanismo de segurança. O futuro portal real seguirá a matriz de RLS e papéis do harness.

## Experiência

Landing de escolha do portal; cliente com visão geral, pedido, revisão, protocolo e histórico; Enpulse com ciclo, fila, bancada, devolutiva, marcos, administração e relatório. Desktop usa sidebar e tabela; tela estreita usa navegação horizontal e cartões. Estados vazios, dado ausente, dado vencido, exceção e falha de comunicação são apresentados em texto, sem depender apenas da cor.

## Observabilidade e reversão

Não há eventos operacionais ou dados persistidos. Desabilitar a variável de Preview remove a demonstração. Em produção a rota permanece indisponível. O legado em `/` e o portal com Supabase não foram alterados por esta fatia.

## Evidências

- `pnpm run build`: passou em 18/11/2026.
- `pnpm test`: 5 testes e verificação local de migrações passaram em 18/11/2026.
- `pnpm exec tsc --noEmit`: passou em 18/11/2026.
- Servidor de produção sem Preview: `/` respondeu 200; `/demo`, `/demo/cliente` e `/demo/operacao` responderam 404.
- Servidor com `VERCEL_ENV=preview` e `ENPULSE_ENABLE_DEMO=true`: dez rotas principais responderam 200.
- Capturas locais verificadas visualmente em 1440 px (central) e 500 px (formulário). A validação por teclado, leitor de tela, 390/768/1280 px e com usuários Enpulse permanece aberta.

## Decisões pendentes

Ver a tabela de decisões na [revisão do plano](../../plataforma/REVISAO_REUNIAO_E_PLANO_FRONTEND.md): horário de abertura, alocação de sexta, fórmula de recomendação, exceções, aceite de ajuste, canal de devolutiva, origem de dados e papéis internos. Nenhuma hipótese do protótipo deve ser aplicada automaticamente ao backend.
