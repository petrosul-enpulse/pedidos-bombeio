# Gates de verificação por fatia

Registrar resultados na seção `Evidências` da especificação. Não usar pedidos de produção como dados de teste.

## Funcional

- Cenários felizes e falhas da especificação executados por ator; contrato HTTP validado para formato, código, mensagens e idempotência.
- Envio duplo da mesma tentativa gera um protocolo; reenvio intencional gera outro e preserva o anterior.
- Corte antes/no/depois da hora, mudança de fuso e data operacional na virada do dia testados com relógio controlado; o banco define o resultado oficial.
- Confirmação e recusa respeitam versão esperada; duas ações concorrentes não produzem estados contraditórios; evento e pedido são gravados juntos.

## Segurança e dados

- Matriz negativa: anônimo; cliente A lendo/escrevendo pedido de B; integrante inativo; leitura tentando confirmar; operador tentando administrar; gestor fora da base autorizada.
- RLS ativo e grants mínimos em todo objeto exposto. Testar com JWT dos perfis e não apenas com `service_role`, que ignora RLS.
- Nenhum CNPJ recebido no corpo altera o cliente associado à sessão. Sem OTP, JWT, chave, cookie ou payload completo em logs e respostas de erro.
- Migração reaplicável ou reconciliada, constraints verificadas, backfill comparado por contagens e soma de volumes, rollback documentado.

## Qualidade de interface

- Desktop e celular em larguras definidas no [design system](../plataforma/DESIGN_SYSTEM.md); teclado, foco, leitor de tela, zoom, contraste AA, carregamento, vazio, erro e conflito.
- Textos de unidade, D+1, prazo e diferença entre solicitado e confirmado consistentes nos dois portais e na exportação.
- Pedido e confirmação podem ser concluídos sem depender de cor, hover ou gráfico.

## Operação

- Build de produção, checagem de tipos e testes automatizados passam; rotas e resposta do Supabase testadas no ambiente alvo.
- Logs permitem correlacionar pedido e evento por `request_id`/protocolo; falha de notificação é visível e recuperável.
- Plano de publicação informa responsável, janela, backup, métricas de acompanhamento, critério de reversão e procedimento para reconciliar pedidos após retorno.
