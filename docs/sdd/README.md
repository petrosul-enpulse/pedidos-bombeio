# Harness SDD da plataforma

SDD aqui significa desenvolvimento guiado por especificações. Cada fatia começa por um comportamento observável, fixa os contratos necessários e termina com evidência de que o comportamento funciona com as permissões corretas. [Plano da plataforma](../plataforma/PLANO.md) define a direção; [modelo de especificação](feature-template.md) define o trabalho concreto.

O [mapa de responsabilidades](RESPONSABILIDADES.md) indica quem decide e quem implementa cada parte. Uma pessoa pode exercer mais de um papel; o contrato de cada papel continua único.

## Responsabilidade única

| Artefato | Responsabilidade | Critério de conclusão |
| --- | --- | --- |
| `GLOSSARY.md` | Significado dos termos de negócio | Cada termo tem uma definição inequívoca, sem regra técnica |
| `docs/plataforma/PLANO.md` | Arquitetura, jornadas, decisões e fases | Uma fatia pode ser priorizada sem redesenhar a plataforma |
| `docs/plataforma/DESIGN_SYSTEM.md` | Linguagem visual e comportamento da interface | Cliente e operação compartilham tokens e padrões verificáveis |
| `docs/sdd/specs/*.md` | Comportamento de uma fatia | Cenários, contrato, permissões e falhas têm aceite observável |
| `supabase/migrations/*.sql` | Evolução versionada do banco | Aplicação e verificação são repetíveis; rollback é documentado |
| Código `app/` e `lib/` | Entrega do comportamento | Interface, servidor e persistência cumprem a especificação |
| `docs/sdd/VERIFICACAO.md` | Gates comuns de qualidade | Evidência registrada para acesso, regra, UX e operação |

## Ciclo de uma fatia

1. **Descobrir**: ler o pedido, o código relevante, o schema remoto e os fatos operacionais. Registrar lacunas em `Decisões pendentes` da especificação. Concluir quando o fluxo atual e o resultado desejado puderem ser descritos em cenários concretos.
2. **Especificar**: criar um arquivo a partir do [modelo](feature-template.md), com ator, gatilho, estados, dados, autorização, erros e critérios de aceite. Concluir quando cada critério puder ser testado sem interpretação adicional.
3. **Contratar**: definir entradas, saídas, eventos, regras de idempotência e estado visual antes do código. Concluir quando cliente, servidor e banco concordarem sobre a mesma operação.
4. **Migrar**: preparar migração aditiva, política RLS e consulta de verificação. Aplicar primeiro em ambiente isolado. Concluir quando outro executor puder repetir a mudança e demonstrar isolamento entre clientes.
5. **Implementar**: entregar o caminho completo da especificação, com módulos cujas interfaces escondem a regra. Concluir quando a jornada funcionar sem acesso privilegiado implícito.
6. **Validar**: executar os [gates](VERIFICACAO.md), revisar em desktop/celular e confrontar resultado com os cenários. Concluir quando a evidência estiver registrada e não houver falha aberta que afete dados, segurança ou operação.
7. **Publicar**: seguir o [runbook do Supabase](SUPABASE.md) e a estratégia de corte do plano. Concluir quando métricas, logs e reversão estiverem conferidos no ambiente de destino.

## Mapa das primeiras especificações

- `specs/01-identidade-e-acesso.md`: acesso de cliente e integrante Enpulse, sem confiança no CNPJ digitado.
- `specs/02-pedido-e-reenvio.md`: envio idempotente, prazo oficial, itens e histórico.
- `specs/03-operacao-e-confirmacao.md`: fila, análise, confirmação, ajustes e auditoria.

Uma fatia pode refiná-las em arquivos menores antes da implementação. O nome de cada ticket local em `.scratch/enpulse-plataforma/issues/` aponta para o comportamento que ele entrega.
