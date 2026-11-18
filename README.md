# Pedido de Bombeio | Base Paulínia (MVP)

> **Evolução em planejamento:** a plataforma de dois portais está descrita em [docs/plataforma/PLANO.md](docs/plataforma/PLANO.md) e governada por [AGENTS.md](AGENTS.md). O schema `enpulse_bombeio` foi criado e verificado vazio/privado, mas o projeto remoto deixou de aparecer na conexão na verificação posterior. É preciso confirmar sua disponibilidade antes de continuar migrações. A aplicação atual ainda aponta para o modelo legado em `public`.

Formulário web para o cliente enviar o pedido de bombeio do dia (BPMN: até 12h), substituindo WhatsApp/telefone + digitação na planilha `bombeiopedido.xlsx`.

**Campos:** CNPJ do cliente (máscara + validação dos dígitos, já aceita o CNPJ alfanumérico em vigor desde jul/2026) e, para GAS A, S500 A e S10 A: quantidade de bombeio e previsão de venda do dia seguinte (m³).

**Regras:**
- Data/hora do envio carimbadas **pelo banco** (trigger), no fuso de Brasília: `data_pedido`, `hora_envio_local`, `dentro_prazo` (antes das 12h).
- Envio após 12h é aceito, mas marcado `dentro_prazo = false` e o cliente é avisado na tela.
- Reenvio no mesmo dia gera nova linha (histórico); a view `vw_pedidos_bombeio_dia` mostra o último envio de cada CNPJ e quantos envios houve.
- Horário de corte ajustável sem deploy: `update config_bombeio set horario_corte = '12:00';`
- Banco com RLS ligado e sem políticas públicas: só a API do formulário (servidor Vercel, chave service_role) grava.

## Estrutura
```
app/page.tsx              formulário (cliente)
app/api/pedidos/route.ts  API: valida de novo e grava no Supabase
lib/cnpj.mjs              máscara e validação de CNPJ
lib/prazo.mjs             horário de Brasília / corte 12h
lib/produtos.ts           lista de produtos e unidade (m³)
supabase/schema.sql       tabela, trigger, RLS e view
docs/CONTAS.md            passo a passo GitHub, Vercel, Supabase
```

## Rodar local
```bash
cp .env.example .env.local   # preencher SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
npm install
npm test                     # testes de CNPJ e horário de corte
npm run dev                  # http://localhost:3000
```

## Publicar
Para o MVP legado, ver `docs/CONTAS.md`. O deploy manual do projeto existente na Vercel está descrito em [docs/DEPLOY_VERCEL.md](docs/DEPLOY_VERCEL.md). Antes de publicar, confirme a disponibilidade do projeto Supabase e as variáveis de produção na Vercel.

## Consultar os pedidos do dia (SQL Editor do Supabase)
```sql
select * from vw_pedidos_bombeio_dia
 where data_pedido = (now() at time zone 'America/Sao_Paulo')::date
 order by dentro_prazo desc, total_bombeio desc;
```

## Próximos passos sugeridos
1. Tabela `clientes` (CNPJ, razão social, e-mail/WhatsApp) e recusar CNPJ não cadastrado.
2. Painel da base (status recebido > ajustado > confirmado) e exportação para a planilha "papel de pão" ou leitura direta no Power BI.
3. Cruzar com previsão de tanque do PETROW para sugerir o corte proporcional automaticamente.
