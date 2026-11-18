# Título da fatia

**Estado:** rascunho | aprovado | em implementação | validado
**Responsável pela decisão de negócio:** nome ou papel
**Dependências:** especificações e decisões que bloqueiam esta fatia

## Objetivo e atores

Qual resultado o cliente ou integrante Enpulse consegue obter? Quem inicia, quem observa e quem decide?

## Cenários de aceite

1. Dado ..., quando ..., então ... .
2. Dado erro/expiração/concorrência ..., quando ..., então ... .
3. Dado usuário sem permissão ..., quando ..., então ... .

## Invariantes

Regras que devem continuar verdadeiras em todo estado, inclusive em falha e reenvio.

## Contratos

Entradas, saídas, validação, estados de erro, idempotência, auditoria e notificações. Indicar o dono de cada regra: interface, servidor ou banco.

## Dados e autorização

Tabelas/colunas afetadas, migração aditiva, papéis autorizados por operação e matriz RLS para anônimo, cliente A, cliente B, operador e administrador.

## Experiência

Telas, estado vazio, carregamento, sucesso, erro, teclado, leitor de tela e comportamento no celular. Referenciar o design system sem copiar tokens.

## Observabilidade e reversão

Evento operacional, métricas, tratamento de indisponibilidade, estratégia de corte e como retornar ao comportamento anterior sem perda de dados.

## Evidências

Comandos de validação e resultados, cenário de ponta a ponta, revisão visual e consulta de isolamento.

## Decisões pendentes

Cada pergunta tem dono e prazo. Uma suposição temporária é marcada como tal; não vira regra silenciosa.
