# 04: Entrada de volumes clara e responsiva

**What to build:** O cliente informa bombeio e previsão de venda D+1, em m³, para GAS A, S500 A e S10 A, entendendo rapidamente o que cada valor representa.

**Blocked by:** 01: Identidade Enpulse e prazo confiável.

**Status:** ready-for-agent

- [ ] Os seis valores são comparáveis em desktop e aparecem em cartões legíveis no celular, sem rolagem horizontal.
- [ ] Campos aceitam o formato decimal brasileiro até três casas, exibem unidade e exemplos, e distinguem vazio de valor inválido.
- [ ] Valores negativos, acima do limite ou todos zerados são rejeitados com mensagens junto aos campos; cliente e servidor aplicam a mesma regra.
- [ ] O resumo atualiza bombeio e previsão sem apagar valores já preenchidos após correções.
