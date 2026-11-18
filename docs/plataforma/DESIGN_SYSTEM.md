# Design system Enpulse para a plataforma

**Base visual:** captura fornecida pelo cliente, com verde, cinza, curvas de pulso e fotografia industrial. Ela é referência, não arquivo mestre da marca. A marca vetorial e a foto de maior resolução devem ser substituídas quando a Enpulse as disponibilizar. O desenho atual do formulário permite validar a direção visual.

## Princípios de interface

1. **Operação primeiro:** número, unidade, prazo e estado são legíveis antes do ornamento. A fotografia aparece no acesso e nos cabeçalhos, longe de tabelas e campos densos.
2. **Uma verdade por tela:** solicitado, confirmado e previsão usam nomes, cores e posições estáveis. O verde sinaliza ações e progresso, não mascara valores diferentes.
3. **Densidade controlada:** cliente preenche em cartões amplos; operação trabalha com tabela compacta, filtros persistentes e detalhe contextual.
4. **Confiança visível:** protocolo, autoria, horário oficial, última atualização e histórico aparecem perto da decisão que sustentam.

## Tokens propostos

| Uso | Token | Valor inicial |
| --- | --- | --- |
| Marca | `brand-500` | `#71BF45` |
| Marca escura para texto/ícones | `brand-800` | `#2F6D2E` |
| Cinza da marca | `brand-gray` | `#858891` |
| Texto principal | `ink-900` | `#1D2B24` |
| Texto secundário | `ink-600` | `#536359` |
| Tela | `surface-canvas` | `#F5F7F4` |
| Cartão | `surface-0` | `#FFFFFF` |
| Linha | `border-200` | `#DCE4DA` |
| Atenção/prazo encerrado | `warning-700` | `#76500E` |
| Erro/recusa | `danger-700` | `#A7332D` |

O verde `brand-500` serve para superfícies e botões com texto escuro. Texto pequeno sobre branco usa `brand-800` e deve passar contraste AA. Cinza da marca não substitui a cor de texto secundário. Espaçamento em escala de 4 px (4, 8, 12, 16, 24, 32, 48, 64), raios 8/12/20 px, foco visível de 3 px, sombra leve apenas para separar superfícies. Tipografia inicial: fonte de sistema com números tabulares; avaliar fonte corporativa quando disponível. Escala: corpo 16 px, detalhe 13–14 px, seção 22–26 px, título 36–48 px. Nenhuma informação operacional depende só da cor.

## Casca e navegação

### Desktop, ≥ 1200 px

- **Cliente:** cabeçalho limpo com marca, base, navegação `Início / Novo pedido / Histórico` e conta; conteúdo até 1160 px, formulário 8 colunas e resumo 4 colunas. Prazo em faixa contextual acima dos campos.
- **Enpulse:** menu lateral de 232 px com `Visão do dia / Pedidos / Relatórios / Administração`; topo com base, dia, atualização e usuário; conteúdo até 1440 px. Filtros em barra única, KPIs de uma linha, tabela abaixo; detalhe abre página ou painel lateral de pelo menos 440 px.

### Tablet, 768–1199 px

- Menu interno recolhido; filtros essenciais visíveis e secundários em painel; detalhes em página completa. O resumo do formulário deixa de ser fixo quando reduzir área útil.

### Celular, < 768 px

- Cliente: produto por cartão, dois valores lado a lado quando houver 360 px úteis, um por linha abaixo disso; ação principal fixa no rodapé da revisão, sem encobrir campos nem teclado.
- Enpulse: lista em cartões com protocolo, cliente, status, prazo e total; filtros em folha modal; ações do detalhe em barra inferior. Tabela horizontal de desktop não é encolhida.

## Padrões compartilhados

| Padrão | Comportamento esperado |
| --- | --- |
| `StatusBadge` | Rótulo textual + cor: recebido, em análise, aguardando cliente se adotado, confirmado, recusado, substituído |
| `DeadlineNotice` | Corte, data, fuso e estado; após o corte mantém envio possível e explica a análise |
| `VolumeField` | Máscara decimal brasileira, m³ visível, erro ao lado, três casas e limite explicado |
| `VolumeComparison` | Colunas `Solicitado / Confirmado / Diferença`; previsão D+1 separada |
| `OrderTimeline` | Evento, autor/papel, horário local e motivo, em ordem cronológica |
| `SummaryCard` | Totais por produto e total geral sem esconder itens zerados na revisão |
| `EmptyState` | Explica ausência e oferece a próxima ação específica, sem ilustração genérica |
| `ErrorState` | Preserva contexto digitado, identifica se é validação, acesso, conflito ou conexão |

## Composição das telas críticas

### Cliente — novo pedido

1. Cabeçalho com marca e cliente selecionado.
2. Faixa de prazo com corte e relógio da base.
3. Identificação do cliente em cartão somente leitura.
4. Produtos: nome à esquerda; bombeio e venda D+1 em campos alinhados; ajuda curta sobre D+1.
5. Resumo persistente no desktop; no celular, resumo antes da ação final.
6. Tela de revisão distinta: todas as quantidades, prazo oficial e botão `Confirmar envio`.
7. Comprovante com protocolo grande, linha do tempo inicial e opção de imprimir/copiar.

### Enpulse — fila do dia

1. Cabeçalho `Operação de bombeio` com data/base, hora da última leitura e ação de atualizar.
2. Indicadores clicáveis: recebidos, em análise, após corte e confirmados; abaixo, totais por GAS A, S500 A e S10 A.
3. Busca por protocolo/CNPJ/nome; filtros por status, prazo, produto e período, com chips dos filtros ativos.
4. Tabela com células alinhadas à direita para volume, cabeçalho fixo, ordenação por hora/status e paginação por cursor.
5. Linha com alerta de reenvio e link para histórico; ações de negócio no detalhe, evitando botões pequenos em cada célula.

### Enpulse — detalhe e confirmação

Cabeçalho com protocolo, cliente, data e status. A primeira área compara o pedido original e a proposta de confirmação por produto. Motivo é obrigatório quando algum volume diverge. A segunda área mostra previsão D+1, prazo aplicado e linha do tempo. A ação de confirmar exibe resumo final e valida a versão atual; conflito apresenta os valores recém-atualizados para revisão. A confirmação concluída mostra autor, horário e comunicação ao cliente.

## Estados, acessibilidade e conteúdo

- Três níveis de feedback: ajuda junto ao campo, alerta no contexto da seção e confirmação global. Erros apontam o campo e preservam valores.
- `aria-live` para protocolo e falha de envio; rótulos reais para campos e status; navegação completa por teclado; zoom a 200% e 400% sem perda de ação. Alvo WCAG 2.2 AA.
- Skeleton apenas para dados que realmente carregam; não trocar uma tabela inteira por uma animação a cada filtro. Estados vazios distinguem `sem pedidos no dia` de `sem resultado para estes filtros`.
- Textos de ação usam verbos precisos: `Enviar pedido`, `Assumir análise`, `Propor ajuste`, `Confirmar volumes`, `Recusar pedido`. Evitar `Salvar` quando a ação altera o estado operacional.
- Data e hora exibem fuso da base; exportações incluem colunas separadas para solicitado, confirmado e previsão, sempre em m³.

## Critérios visuais de aceite

Revisar em 390, 768, 1280 e 1440 px; validar contraste, foco, zoom, teclado, leitor de tela, estados com nomes e números longos, lista vazia e lista volumosa. Mostrar à operação duas jornadas completas: pedido sem ajuste e pedido com ajuste. A marca final depende de ativo oficial; a consistência e a usabilidade não dependem dele.
