# Frontend de validação da plataforma

O frontend aprovado está disponível localmente em `/demo`. Ele usa uma persona de cliente e outra de integrante Enpulse, pedidos e saldos fictícios e um relógio de cenário fixo. Nada nesta área acessa o Supabase ou envia mensagens. Recarregar a página restaura os dados iniciais.

## Acesso

1. Na raiz do repositório, execute `pnpm dev` (ou `npm run dev` se npm estiver instalado).
2. Abra `http://localhost:3000/demo`. Se o servidor usar outra porta, substitua `3000`.
3. Escolha **Portal do cliente** ou **Central de operações**. Use o seletor no topo para alternar entre dia útil, sexta-feira e janela encerrada.

Em um deploy da Vercel de **Preview**, configure `ENPULSE_ENABLE_DEMO=true` somente no ambiente Preview para compartilhar a validação. A rota retorna 404 fora do desenvolvimento local ou de um Preview autorizado, inclusive em produção. Não adicione segredos para usar a demonstração.

## Jornadas para validar

- Cliente: pedido D+1, previsão ausente versus `0 m³`, exceção, revisão, protocolo, histórico e retorno.
- Sexta: três datas alvo e cenário de 1–3 bombeios; a alocação final por data continua uma decisão aberta.
- Operação: fila filtrável, qualidade do snapshot, cobertura de estoque, sugestão **ilustrativa**, decisão com justificativa, prévia da devolutiva e falha simulada.
- Marcos externos: registro manual da ação no Canal Cliente até 15h, confirmação da base até 15h30 e resultado.
- Relatório: exportação CSV exclusivamente de dados fictícios.

## Limite da primeira entrega

O formulário legado em `/` e as rotas atuais `/cliente` e `/operacao` mantêm seu comportamento. O backend existente ainda não modela D+1, sexta-feira multi-data, previsão ausente nem snapshots operacionais. A futura integração deve substituir o `MockPlatformGateway` pelo adaptador real após validar contratos, janela, regras de recomendação e o novo projeto Supabase. Consulte [o plano aprovado](REVISAO_REUNIAO_E_PLANO_FRONTEND.md) e [a especificação SDD](../sdd/specs/04-frontend-demonstracao.md) para decisões abertas, critérios e evidências.
