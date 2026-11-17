# Passo a passo: contas GitHub, Vercel e Supabase (Petrosul/Enpulse)

Convidados G4: `fernando.santos@g4educacao.com` e `lucas.reis@g4educacao.com`

**Regra de governança:** crie tudo com um e-mail corporativo de TI (ex.: `ti@...` ou `sistemas@...`), não pessoal, ative 2FA e **não compartilhe senha**: convide cada pessoa com o próprio e-mail. Assim a empresa é dona do código e dos dados, e o acesso do G4 pode ser removido ao fim da mentoria com um clique (trilha de auditoria por usuário).

---

## 1. GitHub (gratuito, sem limite de membros)

1. Acesse github.com/signup e crie a conta com o e-mail corporativo. Ative 2FA (Settings > Password and authentication).
2. Crie uma **Organization** (não um usuário "empresa"): menu "+" > *New organization* > plano **Free** > nome sugerido `petrosul-enpulse` > "My business or institution" > razão social.
3. Crie o repositório: *New repository* > `pedido-bombeio` > **Private**.
4. Suba o código desta pasta: na página do repo, *Add file > Upload files* e arraste o conteúdo (sem `node_modules`/`.next`), ou via git:
   ```bash
   git init && git add . && git commit -m "MVP formulário pedido de bombeio"
   git branch -M main
   git remote add origin https://github.com/petrosul-enpulse/pedido-bombeio.git
   git push -u origin main
   ```
5. Convide o G4: Organization > *People* > *Invite member* > digite cada e-mail > papel **Member**. Depois, no repo: *Settings > Collaborators and teams* > dê **Write** (ou crie um Team "G4" com Write).

**Limite do Free:** repositórios privados e membros ilimitados. Proteção de branch obrigatória em repo privado só no plano Team (US$ 4/usuário/mês); não é necessário para o MVP.

---

## 2. Supabase (gratuito, membros ilimitados)

1. supabase.com > *Start your project* > **Continue with GitHub** usando a conta corporativa (centraliza o login).
2. Crie a **Organization** `Petrosul Enpulse` > plano **Free**.
3. *New project* > nome `pedido-bombeio` > região **South America (São Paulo)** > gere uma senha forte do banco e guarde no cofre de senhas.
4. *SQL Editor > New query* > cole o arquivo `supabase/schema.sql` > **Run**.
5. Anote em *Project Settings > API*: **Project URL** e a chave **service_role / secret** (secreta; vai só na Vercel).
6. Convide o G4: *Organization settings > Team > Invite* > cada e-mail > papel **Developer** (ou Admin, se forem criar tabelas e políticas).

**Limites do Free:** 2 projetos ativos, 500 MB de banco por projeto, membros ilimitados (papéis Owner/Admin/Developer; papel *Read-only* só no Team). **Atenção:** projeto Free **pausa após 7 dias sem uso**. Em operação diária isso não ocorre, mas antes de ir para produção avalie o Pro (a partir de US$ 25/mês: sem pausa e com backup diário).

---

## 3. Vercel (Hobby, gratuito, login compartilhado com o G4)

**Decisão:** plano Hobby; o formulário evolui **só pelo GitHub** (cada push na `main` faz deploy automático). O login da Vercel é compartilhado com o G4 apenas para acompanhar deploys e logs.

1. vercel.com/signup > **Continue with Email** usando um e-mail corporativo dedicado (ex.: `sistemas@...`).
   Não use "Continue with GitHub": aí compartilhar o login da Vercel significaria compartilhar também a conta GitHub dona da organização.
2. *Add New > Project* > *Install GitHub App* > autorize na organização `petrosul-enpulse`, só no repo `pedido-bombeio` > Import (Framework: Next.js).
   Se a Vercel bloquear repo privado de organização no Hobby, a saída é tornar o repo público (o código não tem segredos; as chaves ficam só nas variáveis da Vercel).
3. Antes do Deploy, em *Environment Variables*:
   - `SUPABASE_URL` = Project URL do Supabase
   - `SUPABASE_SERVICE_ROLE_KEY` = chave service_role
4. **Deploy**. URL tipo `pedido-bombeio.vercel.app`.

**Segurança do login compartilhado (mínimo):**
- Senha forte e exclusiva (16+ caracteres, gerada), enviada por cofre de senhas ou link de uso único, nunca por WhatsApp/e-mail em texto.
- Ative 2FA com app autenticador (TOTP). Para os três usarem, cadastre o mesmo QR code no app de cada um, ou guarde o TOTP no cofre de senhas compartilhado.
- O G4 não altera variáveis de ambiente nem domínio; mudança de código só via GitHub (onde cada um tem login próprio e fica o histórico).
- Ao fim da mentoria: troque a senha, gere novo 2FA e revise *Settings > Security* (sessões e tokens ativos).

**Limites do Hobby:** sem membros de time (por isso o login compartilhado), 100 GB de transferência/mês e uso pessoal/não comercial pelos termos da Vercel. Para o MVP com ~30 clientes o volume é irrisório; ao entrar em produção definitiva, migrar para o Pro (US$ 20/mês, G4 como Viewer grátis) resolve os termos e o acesso individual sem mudar código.
