# Instruções do projeto

Este repositório evolui do formulário atual para a plataforma de bombeio da Enpulse. Antes de alterar um fluxo, leia [o plano](docs/plataforma/PLANO.md), [o glossário](GLOSSARY.md), [o harness SDD](docs/sdd/README.md) e [as responsabilidades](docs/sdd/RESPONSABILIDADES.md). A migração inicial criou apenas o namespace `enpulse_bombeio` e foi verificada; uma consulta posterior não encontrou o projeto remoto. Confirme disponibilidade e referência antes de qualquer nova ação no Supabase. O aplicativo atual aponta para o modelo legado em `public`.

## Responsabilidade de cada mudança

- Escolha uma especificação de comportamento e entregue uma fatia verificável que atravesse interface, autorização, persistência e testes necessários. Registre decisões de domínio na especificação, e decisões difíceis de reverter em ADR.
- Use um único lugar para cada regra: horário e estado oficial no banco; permissão de acesso na identidade e nas políticas; apresentação no design system. A interface pode antecipar validações, mas o servidor valida de novo.
- Vincule toda ação do cliente ao usuário autenticado e ao cliente cadastrado. O CNPJ digitado não concede acesso. Registre o volume solicitado sem sobrescrevê-lo quando houver análise ou ajuste.
- Trate `public.pedidos_bombeio` e `public.config_bombeio` como legado ativo até a etapa de migração. Expanda, valide, mude o tráfego e só depois considere desativação. Preserve o histórico.

## Ações no projeto e no Supabase

1. Defina cenário, invariantes, estados de erro e critérios observáveis no formato de `docs/sdd/feature-template.md`. A especificação aprovada é a referência da implementação.
2. Para mudança de dados, escreva migração incremental em `supabase/migrations/`. Leia o estado remoto, confira o alvo `qzrwgxxltwzlkszozoca`, aplique em ambiente de teste e registre evidência de reversão antes de produção.
3. Em `enpulse_bombeio`, conceda somente privilégios exigidos pela funcionalidade. Ative RLS antes de expor tabelas; teste com perfis anônimo, cliente A, cliente B, operador e administrador. A chave `service_role` pertence apenas a operações administrativas controladas no servidor.
4. Implemente a fatia no Next.js e valide contrato de entrada/saída, autorização, idempotência e estado visual. Nunca registre OTP, sessão ou chave em logs.
5. Rode os gates de `docs/sdd/VERIFICACAO.md`, anexe resultados à especificação e só marque a fatia concluída quando cliente e Enpulse conseguirem observar o resultado previsto.

## Planejamento

Antes de redigir planos, aplique a skill de planejamento pertinente de `mattpocock-skills`: `to-tickets` para implementação e `wayfinder` para decisões de iniciativas longas. Publique tickets externos apenas com pedido explícito do usuário.
