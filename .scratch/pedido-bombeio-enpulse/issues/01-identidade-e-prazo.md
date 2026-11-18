# 01: Identidade Enpulse e prazo confiável

**What to build:** O cliente encontra um formulário com a identidade Enpulse, entende para qual base está pedindo bombeio e vê o prazo real do dia antes de preencher. A experiência atual de envio continua funcional durante a mudança.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] A linguagem visual parte da imagem fornecida: verde aproximado `#71BF45`, cinza `#858891`, curvas de pulso, superfícies claras e fotografia industrial usada com moderação. Os elementos da marca são reconstruídos em qualidade adequada para tela, sem ampliar a captura pequena como logotipo final.
- [ ] Cores, tipografia, espaçamento, raios, foco e estados são definidos como tokens e aplicados a componentes reutilizáveis do formulário.
- [ ] O horário de corte exibido vem da configuração do servidor e usa `America/Sao_Paulo`; alterar o corte no banco atualiza o aviso sem novo deploy.
- [ ] A página permanece utilizável em desktop e celular, por teclado, e o contraste do verde de marca com o texto é validado.
