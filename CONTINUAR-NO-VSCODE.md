# Continuidade do Portal de Turismo fora do Manus

## O projeto é exportável?

Sim. O projeto é uma aplicação TypeScript/React/Express com Drizzle ORM, banco MySQL/TiDB e código-fonte comum. Ele pode ser aberto no VS Code, versionado em um repositório próprio e executado em outra máquina. O pacote exportado contém o código, as migrações SQL, os testes e os arquivos de configuração necessários para continuar o desenvolvimento.

A exportação não leva credenciais, tokens de Git, banco de dados, arquivos `node_modules`, builds gerados, logs ou configurações internas do projeto Manus. Isso é intencional e necessário para segurança.

## Requisitos locais

Instale Node.js 22 ou superior, pnpm 10, Git e um banco MySQL 8 compatível. MariaDB/TiDB podem funcionar, mas devem ser homologados porque o schema usa recursos do dialeto MySQL. Para desenvolvimento, recomenda-se Docker com MySQL, ou um banco gerenciado separado.

```bash
pnpm install
cp ENVIRONMENT-EXAMPLE.txt .env.local
# edite .env.local com valores reais
pnpm check
pnpm test
pnpm build
pnpm dev
```

O portal de desenvolvimento ficará disponível em `http://localhost:3000`.

## Banco de dados

As definições estão em `drizzle/schema.ts` e as migrações ficam em `drizzle/`. Configure `DATABASE_URL` antes de migrar. Faça backup do banco antes de aplicar qualquer alteração em produção.

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

O banco do Manus não foi incluído no pacote. Para levar os dados atuais, faça um dump autorizado pelo banco de origem e restaure-o no novo MySQL/TiDB. Não copie credenciais do arquivo `.project-config.json`; elas são específicas do ambiente e devem ser revogadas se tiverem sido expostas.

## Dependências específicas do Manus que precisam ser substituídas

A aplicação funciona imediatamente dentro do Manus porque alguns adaptadores são fornecidos pela plataforma. Para uma instalação independente, estes pontos precisam ser trocados:

| Área | Arquivo atual | O que substituir |
|---|---|---|
| Autenticação | `server/_core/oauth.ts`, `server/_core/sdk.ts`, `client/src/const.ts` | Google OAuth, Microsoft Entra ID, Keycloak ou outro provedor OIDC. Mantenha state/nonce, cookies `HttpOnly`, `Secure`, `SameSite` e expiração curta do fluxo OAuth. |
| Sessão | `server/_core/context.ts`, `server/_core/cookies.ts` | Sessão própria assinada ou Redis/session store. Nunca coloque segredo no frontend. |
| Upload | `server/storage.ts`, `server/_core/storageProxy.ts` | S3 compatível, MinIO, Cloudflare R2 ou storage do provedor de hospedagem. Mantenha validação de MIME, tamanho, extensão e autorização por tenant. |
| Mapas | `client/src/components/Map.tsx`, `server/_core/map.ts` | Google Maps com chave restrita por domínio, Mapbox ou OpenStreetMap. Configure limites, faturamento e política de uso. |
| Analytics | `client/index.html` | Remover ou substituir o endpoint de analytics pelo serviço aprovado pela prefeitura, com consentimento e política de privacidade. |
| E-mail | `server/email.ts` | Resend, SMTP institucional ou Microsoft Graph. Configure domínio SPF, DKIM e DMARC antes de produção. |

Os arquivos `ENVIRONMENT-EXAMPLE.txt` e este documento não fornecem credenciais nem tornam esses serviços automaticamente independentes.

## Autenticação administrativa

O usuário proprietário usado no Manus não é uma conta portátil. Em uma instalação independente, configure um provedor OAuth/OIDC próprio e crie o primeiro administrador por um procedimento controlado de bootstrap. O papel `platform_admin` não deve ser atribuído com base em e-mail sem validação adicional.

Antes de produção, implemente MFA para administradores, recuperação de conta, rotação de sessões, bloqueio por tentativas e trilha de auditoria. Usuários municipais devem ficar associados ao tenant correto; nunca remova a verificação de tenant para facilitar testes.

## Publicação independente

A aplicação pode ser hospedada em uma VM, container, Kubernetes ou serviço Node gerenciado. O processo de produção é:

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
NODE_ENV=production pnpm start
```

Coloque um proxy reverso HTTPS (Nginx, Caddy ou load balancer) na frente do Node, configure domínio, TLS, headers de segurança, backups, monitoramento e política de retenção. O processo Node não deve ser exposto diretamente à internet sem HTTPS.

## Checklist antes de vender ou homologar

- [ ] Criar repositório Git próprio e configurar CI para `check`, `test` e `build`.
- [ ] Trocar OAuth, storage, mapas, e-mail e analytics pelos serviços escolhidos.
- [ ] Migrar o banco com backup testado e validar as migrações em staging.
- [ ] Configurar domínio do município e estratégia de tenant por domínio/subdomínio.
- [ ] Implementar MFA, gestão de segredos, rotação de chaves e recuperação de desastre.
- [ ] Revisar LGPD, aviso de privacidade, consentimentos, retenção e atendimento a titulares.
- [ ] Realizar teste de segurança, teste de carga e homologação com a Secretaria.
- [ ] Cadastrar conteúdo real de Adamantina e validar mapa, presença, QR Codes e relatórios.

## Estrutura principal

- `client/`: aplicação React responsiva.
- `server/`: API tRPC, regras de negócio, autenticação e persistência.
- `drizzle/`: schema e migrações do banco.
- `shared/`: tipos e constantes compartilhados.
- `package.json`: scripts e dependências.
- `ENVIRONMENT-EXAMPLE.txt`: referência de configuração sem segredos.

## Regra de segurança

Nunca envie `.env.local`, `.project-config.json`, dumps de produção ou tokens para o Git. Se alguma credencial real tiver sido compartilhada, revogue-a e gere outra imediatamente.
