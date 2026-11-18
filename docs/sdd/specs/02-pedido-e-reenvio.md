# 02 — Pedido, prazo e reenvio

**Estado:** proposta.
**Atores:** usuário do cliente e integrante Enpulse em leitura.
**Dependências:** `01-identidade-e-acesso.md`, catálogo e regras operacionais vigentes.

## Resultado

Cliente autorizado envia volumes de bombeio e previsão D+1 para uma base/data, recebe protocolo e consulta o mesmo registro depois. Uma falha de rede não duplica o pedido; um reenvio deliberado preserva o anterior.

## Cenários de aceite

1. Dado cliente autenticado e volumes válidos, quando confirma revisão, então recebe protocolo, horário do banco, regra de corte aplicada e os valores persistidos.
2. Dado seis campos vazios ou zerados, valor negativo, acima do limite ou decimal com mais de três casas, quando envia, então recebe `422` com erro por campo e nenhum pedido é criado.
3. Dado envio antes, exatamente no e após o corte, quando persiste, então o banco marca corretamente o prazo sem consultar o relógio do navegador; envio tardio permanece permitido.
4. Dado timeout após gravação, quando a mesma chave de idempotência é repetida com o mesmo payload, então o mesmo protocolo é retornado.
5. Dada a mesma chave com payload diferente, quando é repetida, então o servidor responde `409` e não altera o pedido original.
6. Dado reenvio intencional, quando confirmado, então nasce outro protocolo que referencia o anterior; a fila marca qual está vigente.
7. Dado usuário do cliente B, quando solicita protocolo de A, então não consegue ler valores nem existência detalhada do pedido.

## Invariantes e contratos

- Entrada contém base, itens e chave de idempotência; cliente vem da sessão. Produto e unidade vêm do catálogo, não de texto livre enviado pelo navegador.
- Data operacional, fuso, corte e estado do prazo são snapshot no pedido. O banco grava `enviado_em` e evento `pedido_recebido` na mesma transação.
- Itens solicitados são imutáveis após envio. Previsão D+1 permanece separada de bombeio e de confirmação.
- `POST /api/v1/pedidos` devolve `201` no primeiro envio e o pedido existente na repetição; `POST /api/v1/pedidos/:id/reenvios` cria tentativa nova.
- Histórico ordena por data/hora oficial e mostra vínculo entre versões, sem esconder pedidos substituídos.

## Dados e autorização

`bases`, `produtos`, `regras_operacionais`, `pedidos`, `pedido_itens` e `pedido_eventos`. Política de inserção exige vínculo do usuário ao cliente, base ativa e valores válidos; RLS de leitura limita por cliente ou papel Enpulse. Idempotência tem unicidade no banco. Função de criação pode encapsular regra transacional, com identidade explícita e grants mínimos.

## Experiência

Formulário responsivo já iniciado evolui para escolha de contexto, revisão distinta e comprovante persistente. Mostrar o corte vindo da regra aplicável e aviso claro após o prazo; não bloquear o envio. Em falha, preservar valores e oferecer nova tentativa com a mesma chave. O cliente deve identificar `solicitado`, `previsão D+1` e `confirmado` sem confusão.

## Observabilidade e reversão

Medir envios aceitos, rejeições por regra, tentativas repetidas e erros de gravação. O corte para o novo endpoint ocorre só após importação/reconciliação; a rota legada é mantida para reversão controlada, sem escrita concorrente nos dois modelos.

## Decisões pendentes

- Regra para reenvio depois que a Enpulse assumiu ou confirmou o pedido. Dono: operação Enpulse.
- Limites por produto e base, e se a previsão D+1 é obrigatória em algum cenário. Dono: operação Enpulse.
