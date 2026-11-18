# Deploy manual: GitHub → Vercel

O workflow [deploy-vercel.yml](../.github/workflows/deploy-vercel.yml) cria o botão **Run workflow** em **GitHub → Actions → Deploy manual na Vercel**. Ele aceita apenas a branch `main`, envia exatamente o commit selecionado ao projeto Vercel existente, espera o build e registra a URL no resumo da execução. Nenhum push dispara esse workflow.

## O que precisa estar configurado na Vercel

1. **Projeto existente correto:** selecione o projeto que hoje publica o formulário. Em **Settings → Build and Deployment**, confirme **Framework Preset = Next.js**, **Root Directory = raiz deste repositório** e uma versão de Node compatível com o projeto. O workflow usa a Vercel CLI para fazer o build na própria Vercel.
2. **Variáveis de produção:** em **Settings → Environment Variables**, confira `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` com escopo **Production**. A chave de serviço fica apenas no servidor/Vercel; não a cadastre como `NEXT_PUBLIC_*` nem como secret deste workflow. O projeto Supabase usado antes deixou de responder na última verificação; resolva isso antes do primeiro deploy de produção.
3. **Token de acesso Vercel:** crie um token de uma conta com permissão para publicar nesse projeto. Guarde o valor diretamente em um secret do GitHub chamado `VERCEL_TOKEN`; não coloque o token em arquivo ou chat.
4. **IDs do alvo:** obtenha `projectId` e `orgId` ao vincular uma cópia local ao projeto existente com `vercel link` e ler `.vercel/project.json`, ou consulte o **Project ID** nas configurações do projeto e o **Team ID** nas configurações do time. `orgId` é o ID do time/conta que detém o projeto, não o nome exibido. O workflow usa esses IDs para evitar criar/publicar em outro projeto.
5. **Domínio de produção:** confirme no projeto Vercel o domínio que deve receber o deploy. `vercel deploy --prod` publica nesse ambiente.

## O que precisa estar configurado no GitHub

1. O repositório de destino é `petrosul-enpulse/pedidos-bombeio`. O workflow precisa estar na branch padrão `main` para aparecer na aba **Actions**.
2. Publique o workflow na branch padrão `main`. O botão de execução manual só aparece quando o arquivo `workflow_dispatch` está na branch padrão, e a pessoa precisa de permissão de escrita no repositório.
3. Em **Settings → Secrets and variables → Actions → New repository secret**, crie exatamente `VERCEL_TOKEN`, `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID`. Use os IDs do **projeto Vercel existente**. O job declara o ambiente GitHub `production`; se sua organização configurar regras de proteção para esse ambiente, elas serão aplicadas antes do deploy.
4. Em **Settings → Actions**, confirme que GitHub Actions está habilitado para o repositório e que as Actions oficiais `checkout` e `setup-node` são permitidas.

## Como usar

1. Faça commit e push do código desejado para `main`.
2. Abra **Actions → Deploy manual na Vercel → Run workflow**, selecione `main` e execute.
3. Aguarde o job `Publicar produção`. O log mostra o build; o resumo contém a URL. Confirme a página e uma rota que depende do Supabase no domínio de produção.

## Deploy automático já existente

Se o projeto Vercel continua ligado ao GitHub, ele pode **também** publicar automaticamente a cada push em `main`. O workflow manual funciona mesmo assim, mas pode haver dois deploys para o mesmo commit. Depois de validar o botão manual, caso a intenção seja publicar **somente** ao clicar, configure `git.deploymentEnabled: false` no projeto (`vercel.json` ou configuração Git da Vercel). Essa mudança é separada para não interromper o fluxo automático antes de os secrets e o workflow estarem operacionais.

## Diagnóstico

| Sintoma | Conferir |
| --- | --- |
| Botão não aparece | Arquivo publicado na branch padrão; permissão de escrita; Actions habilitado |
| Falha na validação inicial | Nome e valor dos três secrets; branch selecionada `main` |
| Projeto errado ou novo projeto sugerido | `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID` do mesmo projeto existente |
| Build falha | Log do job e configurações de build/variáveis Production na Vercel |
| Página abre, mas pedido falha | Disponibilidade do Supabase e variáveis `SUPABASE_*` na Vercel |

## Referências

- [Vercel CLI em CI/CD](https://vercel.com/kb/guide/how-can-i-use-github-actions-with-vercel)
- [Vercel CLI: projeto e token](https://vercel.com/docs/cli/global-options)
- [Vercel CLI: deploy de produção](https://vercel.com/docs/cli/deploy)
- [GitHub: execução manual](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow)
- [GitHub: secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets)
- [Vercel: desabilitar deploys automáticos](https://vercel.com/docs/project-configuration/git-configuration)
