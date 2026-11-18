# Linguagem da plataforma de bombeio

Termos usados por clientes e pela operação Enpulse para solicitar, analisar e confirmar volumes da Base Paulínia.

## Atores

**Cliente**: empresa cadastrada que solicita bombeio, identificada por CNPJ. Um cliente pode ter vários usuários autorizados.
_Evitar_: conta, CNPJ como usuário.

**Usuário do cliente**: pessoa autorizada pelo cliente a enviar pedidos e consultar seu histórico.
_Evitar_: cliente, quando a intenção é identificar uma pessoa.

**Integrante Enpulse**: pessoa autorizada a acompanhar e tratar pedidos em nome da operação.
_Evitar_: admin para todo integrante.

## Operação

**Pedido de bombeio**: solicitação registrada por um cliente para uma data operacional e uma base, com volumes por produto.
_Evitar_: formulário, quando a intenção é o registro de negócio.

**Data operacional**: dia local da base ao qual o pedido pertence.
_Evitar_: data do navegador.

**Volume solicitado**: quantidade de bombeio enviada pelo cliente para um produto, em m³.
_Evitar_: volume final.

**Previsão de venda D+1**: estimativa de venda do produto no dia seguinte à data operacional, em m³.
_Evitar_: pedido de venda.

**Volume confirmado**: quantidade de bombeio que a Enpulse confirma após análise. Pode diferir do volume solicitado, mantendo ambos visíveis.
_Evitar_: volume editado.

**Ajuste**: proposta documentada de mudança entre o volume solicitado e o confirmado, com motivo e autoria.
_Evitar_: correção silenciosa.

**Reenvio**: novo pedido intencional para a mesma data e cliente que referencia o pedido anterior sem apagar seu histórico.
_Evitar_: atualização do pedido antigo.

**Prazo de envio**: horário de corte configurado para a base e data operacional. O resultado é calculado com o horário do servidor.
_Evitar_: prazo calculado no navegador.

**Protocolo**: identificador público e estável de um pedido, usado em acompanhamento e suporte.
