# Plano de continuidade — Fase 7.1 até a Fase 10

**Projeto:** Portal de Turismo Municipal — Viva Adamantina  
**Objetivo:** transportar o projeto para outra conta/equipe e orientar a conclusão técnica, operacional e institucional.

## 1. Regra geral de execução

O sistema está em **homologação técnica**, não em produção institucional. A próxima equipe deve preservar o isolamento por município, a autenticação e a rastreabilidade. Não deve remover verificações de tenant para facilitar testes, publicar dados de teste como conteúdo oficial ou declarar conformidade LGPD sem validação do jurídico/DPO.

A sequência recomendada é:

1. Preparar o novo ambiente e confirmar que o código atual executa.
2. Concluir a Fase 7.1, que fecha segurança, LGPD operacional e continuidade.
3. Implementar a Fase 8, que transforma o piloto em produto multi-tenant por domínio.
4. Executar a Fase 9, que cadastra e valida a base real de Adamantina.
5. Executar a Fase 10, que realiza homologação institucional, publicação controlada e início do suporte.

A regra de parada é simples: se uma etapa de segurança falhar, não avançar para publicação ou novo tenant. Corrija, teste, registre o resultado e só então prossiga.

## 2. Primeiro dia no novo ambiente

### 2.1 Obter o código correto

Use o repositório Git ou o pacote exportado. O último checkpoint funcional conhecido é `226e7aba`, que contém a correção da pré-visualização após o hardening da Fase 7. Se o repositório tiver alterações posteriores, verifique o histórico antes de usá-las.

O pacote exportado anterior está documentado em `CONTINUAR-NO-VSCODE.md`. Ele não contém banco, credenciais, `node_modules`, builds ou configurações internas do Manus. Isso é intencional.

### 2.2 Instalar e validar dependências

```bash
node --version                 # Node.js 22 ou superior
pnpm --version                 # pnpm 10
pnpm install --frozen-lockfile
cp ENVIRONMENT-EXAMPLE.txt .env.local
# preencher somente os valores reais do novo ambiente
pnpm check
pnpm test
pnpm build
pnpm dev
```

A aplicação deve abrir em `http://localhost:3000`. Se a porta estiver ocupada, use o valor exibido pelo servidor e não altere a lógica de tenant para contornar o problema.

### 2.3 Preparar o banco de homologação

Crie um banco MySQL 8, TiDB ou MariaDB compatível. Configure `DATABASE_URL`, faça backup se estiver migrando um banco existente e aplique as migrações:

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

Nunca aplique migração diretamente em produção sem backup, plano de rollback e validação em staging. O banco do Manus não foi incluído na exportação. Para transportar dados, use somente um dump autorizado e remova dados de teste antes da homologação.

### 2.4 Revalidar integrações

O código atual usa adaptadores Manus para OAuth, storage, mapas e alguns serviços internos. Fora do Manus, substitua estes adaptadores conforme a tabela em `CONTINUAR-NO-VSCODE.md`:

- `server/_core/oauth.ts` e `server/_core/sdk.ts`: provedor OAuth/OIDC institucional.
- `server/_core/context.ts` e `server/_core/cookies.ts`: sessão própria ou store de sessão.
- `server/storage.ts` e `server/_core/storageProxy.ts`: S3, R2 ou MinIO.
- `client/src/components/Map.tsx` e `server/_core/map.ts`: Google Maps, Mapbox ou OpenStreetMap.
- `server/email.ts`: Resend, SMTP institucional ou Microsoft Graph.

Não misture credenciais do ambiente antigo com o novo. Gere segredos novos e revogue qualquer segredo que tenha sido exposto.

## 3. Fase 7.1 — fechamento de segurança e governança

Esta fase deve ser concluída antes da venda ou publicação municipal. A Fase 7 atual adicionou sessão de 12 horas, cookies ajustados, headers HTTP, limite global de payload, validação de upload e documentação inicial. Ela ainda não implementou todos os controles institucionais.

### 3.1 Corrigir convites administrativos

Arquivos principais: `drizzle/schema.ts`, `server/db.ts`, `server/routers.ts`, `server/email.ts`.

1. Adicione uma coluna para hash do token ou substitua `invitations.token` por um valor de hash.
2. Gere o token aleatório apenas uma vez e envie o token cru no link do e-mail.
3. Armazene somente `sha256(token)` com comparação em tempo constante ou comparação por hash no banco.
4. Não retorne o token cru na resposta do painel após o envio real do e-mail.
5. Aceite o convite em uma transação: validar token, validar e-mail, atualizar usuário e marcar convite como aceito.
6. Use condição atômica para impedir dois aceites do mesmo convite.
7. Registre a aceitação na auditoria sem armazenar o token.
8. Crie testes para token expirado, token reutilizado, e-mail diferente e duas aceitações concorrentes.

### 3.2 Separar editar, moderar e publicar

Arquivos principais: `server/_core/trpc.ts`, `server/routers.ts`, `client/src/pages/AdminCatalog.tsx`, `client/src/pages/AdminEvents.tsx`.

1. Mantenha `platform_admin` e `municipal_admin` como responsáveis por publicar conteúdo institucional.
2. Permita ao moderador revisar submissões e alterar status apenas pelo fluxo de moderação.
3. Remova `status` livre das mutações de edição usadas por moderadores ou ignore `approved` quando o papel não puder publicar.
4. Registre ator, tenant, conteúdo anterior, conteúdo novo e motivo da decisão.
5. Teste que moderador não publica diretamente e que um município não altera o conteúdo de outro.

### 3.3 Implementar proteção CSRF/Origin

Arquivos principais: `server/_core/index.ts`, `server/_core/context.ts`, `server/_core/cookies.ts`.

1. Defina a lista de origens oficiais por ambiente.
2. Para mutations autenticadas via cookie, valide `Origin` ou `Referer` contra essa lista.
3. Recuse requests de origem desconhecida com `403`.
4. Mantenha o estado/nonce do OAuth, cookies `HttpOnly`, `Secure` em HTTPS e `SameSite` coerente.
5. Teste mutations com origem oficial, origem ausente conforme a política escolhida e origem maliciosa.

Não desabilite a proteção para fazer o preview funcionar. A exceção do preview deve estar limitada aos hosts controlados do ambiente e documentada em `server/security.ts`.

### 3.4 Adicionar rate limiting

Escolha uma solução compatível com o ambiente de produção. Para um único processo, um limitador em memória pode servir para homologação, mas a produção multi-instância deve usar Redis ou mecanismo equivalente.

Aplique limites diferentes para:

- convites administrativos;
- submissões, comentários e avaliações;
- presença e QR Code;
- upload de mídia;
- endpoints de autenticação e callback;
- consultas públicas de alto custo.

O limite deve considerar IP, usuário autenticado e tenant quando possível. Retorne `429` sem revelar dados internos. Teste limites e recuperação após a janela expirar.

### 3.5 Completar a auditoria

Use `auditLogs` e o helper `recordAudit` como base. Registre, no mínimo:

- criação, edição, aprovação, rejeição e arquivamento de locais e eventos;
- alteração de perfis, responsáveis e Cadastur;
- upload e exclusão de mídia;
- criação, revogação e expiração de QR Codes;
- criação, alteração, suspensão e reativação de usuários;
- convite enviado e convite aceito;
- exportação de relatório;
- falhas de autorização e tentativa de acesso a outro tenant.

Não registre CPF, token de convite, senha, access token ou payload completo com dados pessoais. Use metadados mínimos e, quando necessário, apenas domínio do e-mail.

### 3.6 Corrigir presença concorrente e retenção

1. Defina a unidade de deduplicação com a prefeitura, por exemplo, usuário/evento/janela de 12 horas.
2. Crie uma chave única compatível com essa regra ou use uma operação atômica no banco.
3. Teste duas requisições simultâneas.
4. Defina prazo de retenção para presença, cidade, estado e país.
5. Implemente anonimização ou descarte após o prazo aprovado.
6. Mantenha relatórios agregados e não exporte identificadores do visitante.

### 3.7 Completar a experiência administrativa

O item “Presença & QR Codes” do menu de `client/src/pages/Admin.tsx` ainda apresenta um placeholder. Crie um módulo real ou redirecione claramente para o módulo que já possui as funções.

A tela deve permitir listar eventos publicados, gerar QR Code, visualizar validade, revogar códigos, consultar contagens agregadas e filtrar por evento/período. Não deve mostrar CPF ou identidade individual de visitantes.

### 3.8 Direitos do titular e política LGPD

Criar, com validação do jurídico/DPO:

- aviso de privacidade público;
- finalidade e base legal para perfil, comentários, presença e dados de responsáveis;
- registro de consentimento quando utilizado;
- exportação dos dados do titular autenticado;
- solicitação de exclusão ou anonimização;
- retirada de consentimento quando aplicável;
- canal institucional para solicitações;
- prazos de retenção e descarte;
- procedimento de incidente de segurança.

Não invente a base legal. A aplicação deve permitir a configuração, mas o jurídico deve aprovar o texto e a finalidade.

### 3.9 Backup, restauração e monitoramento

1. Configure backup do banco com retenção definida.
2. Crie inventário das chaves de mídia e política de recuperação do storage.
3. Criptografe backups e restrinja acesso.
4. Faça restauração em ambiente separado.
5. Registre data, duração, resultado e falhas do teste.
6. Crie health check que valide aplicação e conectividade do banco sem expor dados.
7. Configure logs centralizados, alertas e monitoramento de erros.
8. Documente responsável, frequência, RPO, RTO e procedimento de incidente.

Não declare backup concluído apenas porque um arquivo foi criado. O critério é restauração comprovada.

### 3.10 Uploads e mídia

1. Mantenha validação de extensão, MIME e assinatura binária.
2. Remova EXIF e metadados de localização quando a biblioteca escolhida permitir.
3. Mantenha limite de 5 MB e limite de itens por galeria.
4. Defina thumbnails e dimensões máximas para evitar imagens abusivamente grandes.
5. Crie rotina para identificar mídia sem referência no banco.
6. Remova objetos órfãos conforme a política do storage, ou documente o ciclo de retenção se a remoção não for suportada.

### 3.11 Critério de saída da Fase 7.1

Só marque a fase como concluída quando:

- P0 e P1 do relatório `AUDITORIA-FASES-1-7-E-PRONTIDAO-FASE-8.md` estiverem fechados;
- testes de autorização, tenant, convite, CSRF e concorrência passarem;
- backup tiver restauração comprovada;
- MFA estiver imposto pelo provedor institucional;
- política LGPD estiver aprovada;
- painel de presença não tiver placeholder;
- `pnpm check`, `pnpm test` e `pnpm build` passarem;
- houver checkpoint ou tag Git com descrição do resultado.

## 4. Fase 8 — produto multi-tenant por domínio

### 4.1 Modelo de domínio e tenant

Adicionar uma tabela de domínios associados a tenants, com domínio, tenant, status, domínio canônico, data de verificação e timestamps. O domínio deve ser único.

Implementar resolução no servidor a partir do host validado. Nunca aceite `X-Forwarded-Host` sem proxy confiável. O slug pode continuar como fallback apenas em desenvolvimento ou em uma rota explicitamente administrativa.

Fluxo recomendado:

1. Receber o host do request.
2. Normalizar caixa, porta e ponto final.
3. Consultar domínio ativo.
4. Resolver tenant ativo.
5. Anexar tenant ao contexto.
6. Rejeitar host desconhecido no portal público ou redirecionar para domínio neutro.
7. Comparar sempre `ctx.user.tenantId` com o tenant resolvido.

Criar testes com dois tenants, hosts válidos, host desconhecido, domínio inativo e tentativa de acesso cruzado.

### 4.2 Branding por prefeitura

Adicionar configuração por tenant para:

- nome público;
- logo e favicon;
- cores principais;
- secretaria responsável;
- textos institucionais;
- telefone, e-mail e endereço;
- links de redes sociais;
- política de privacidade;
- configuração de mapa;
- configuração de e-mail;
- idioma e fuso horário, se necessário.

A identidade atual “Viva Adamantina” deve virar configuração do tenant Adamantina, não texto fixo espalhado pelas páginas.

### 4.3 Administração da plataforma

Criar módulo de plataforma para:

- criar, ativar, suspender e arquivar tenants;
- associar e verificar domínios;
- definir branding;
- criar primeiro administrador municipal por convite controlado;
- acompanhar saúde e configuração de cada tenant;
- consultar relatórios comparativos somente quando autorizado.

A prefeitura não pode criar `platform_admin`.

### 4.4 Onboarding municipal

Criar checklist de onboarding com status por tenant:

1. órgão responsável confirmado;
2. administrador municipal convidado;
3. domínio configurado;
4. logo e identidade recebidos;
5. política de privacidade aprovada;
6. conteúdo inicial importado;
7. mapas revisados;
8. QR Code testado;
9. relatórios testados;
10. homologação assinada.

### 4.5 Critério de saída da Fase 8

A fase só está pronta quando dois tenants fictícios funcionarem simultaneamente, com branding diferente, dados isolados, administradores separados e domínios distintos. O tenant Adamantina deve continuar funcionando após remover o slug fixo do caminho normal do usuário.

## 5. Fase 9 — dados reais de Adamantina

### 5.1 Preparar a coleta

A prefeitura deve indicar um responsável pelo conteúdo e fornecer planilha ou formulário validado. Não importar dados de redes sociais ou mapas sem verificar licença, fonte e atualidade.

Categorias mínimas:

- atrativos e pontos de interesse;
- patrimônio e cultura;
- hotéis, pousadas e hospedagem;
- restaurantes, bares e cafeterias;
- comércio e serviços turísticos;
- transporte e acessibilidade;
- eventos recorrentes e eventos confirmados.

### 5.2 Campos mínimos antes da publicação

Cada ficha deve ter nome, categoria, descrição, endereço, cidade/UF, coordenadas ou localização validável, contato público quando autorizado, horário quando aplicável, acessibilidade quando conhecida, fonte do dado e responsável pela validação.

Cadastur deve ser marcado como informado, pendente, validado ou rejeitado somente conforme evidência recebida. Não transformar ausência de informação em validação.

### 5.3 Processo de validação

1. Importar em staging.
2. Remover duplicidades.
3. Validar coordenadas no mapa.
4. Confirmar telefone, endereço e horários.
5. Solicitar autorização para fotos e logos.
6. Registrar fonte, data e responsável.
7. Fazer revisão municipal.
8. Publicar apenas os registros aprovados.
9. Criar rotina de revisão periódica.

### 5.4 Testes com usuários reais

Convidar servidores da Secretaria, comerciantes autorizados e um pequeno grupo de moradores/turistas. Testar busca, mapa, detalhes, login, avaliação, comentário, roteiro, presença, convite administrativo e relatórios.

Registrar problemas por severidade. Nenhum problema P0 de segurança ou isolamento pode permanecer aberto na homologação.

## 6. Fase 10 — homologação institucional e publicação

### 6.1 Documentação institucional

Preparar:

- manual do administrador municipal;
- manual do moderador;
- manual do analista;
- política de privacidade;
- política de retenção;
- matriz de permissões;
- plano de backup e restauração;
- plano de resposta a incidentes;
- termo de homologação;
- inventário de integrações e responsáveis;
- contrato de suporte e SLA.

### 6.2 Homologação técnica

Executar em ambiente de staging:

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
```

Executar também testes de segurança, isolamento, carga básica, backup/restauração, compatibilidade mobile e revisão de acessibilidade.

### 6.3 Publicação controlada

1. Fazer backup final e confirmar restauração possível.
2. Configurar domínio e TLS.
3. Configurar DNS e remetente institucional.
4. Impor MFA para administradores.
5. Configurar monitoramento e alertas.
6. Publicar primeiro com dados aprovados.
7. Acompanhar logs e erros durante a janela inicial.
8. Confirmar que relatórios e QR Codes funcionam em produção.
9. Registrar aceite formal da Secretaria.
10. Ativar rotina de suporte e revisão de conteúdo.

### 6.4 Critério de conclusão da Fase 10

O produto só pode ser tratado como homologado quando a Secretaria confirmar por escrito o conteúdo, as permissões, o tratamento de dados, os relatórios, a presença, o domínio e o procedimento de suporte. A publicação técnica sem esse aceite não é homologação institucional.

## 7. Arquivos principais para o próximo agente

| Área | Arquivos |
| --- | --- |
| Schema e migrações | `drizzle/schema.ts`, `drizzle/*.sql`, `drizzle/relations.ts` |
| API e autorização | `server/routers.ts`, `server/_core/trpc.ts`, `server/_core/context.ts` |
| Persistência | `server/db.ts` |
| Sessão | `server/_core/oauth.ts`, `server/_core/sdk.ts`, `server/_core/cookies.ts` |
| Segurança | `server/security.ts`, `server/privateData.ts`, `FASE-7-SEGURANCA-E-LGPD.md` |
| Upload | `server/storage.ts`, `server/_core/storageProxy.ts` |
| Portal | `client/src/App.tsx`, `client/src/pages/Home.tsx`, `Events.tsx`, `PlaceDetail.tsx`, `EventDetail.tsx` |
| Painel | `client/src/pages/Admin.tsx`, `AdminCatalog.tsx`, `AdminEvents.tsx`, `AdminModeration.tsx`, `AdminReports.tsx`, `AdminUsers.tsx` |
| Continuidade | `CONTINUAR-NO-VSCODE.md`, `ENVIRONMENT-EXAMPLE.txt`, `AUDITORIA-FASES-1-7-E-PRONTIDAO-FASE-8.md` |

## 8. Comandos de validação obrigatórios

```bash
pnpm check
pnpm test
pnpm build
pnpm dev
```

Antes de cada entrega, verificar:

- página inicial pública;
- detalhes de local e evento;
- login/logout;
- painel sem login;
- painel com papel não autorizado;
- isolamento de tenant;
- criação e moderação;
- upload válido e inválido;
- QR Code ativo, expirado e revogado;
- relatório filtrado e exportado;
- mobile;
- headers HTTP;
- logs sem segredos.

## 9. Itens que não devem ser feitos

Não armazenar credenciais no repositório. Não copiar o `.project-config.json` para outro ambiente. Não colocar imagens grandes em `client/public`. Não armazenar bytes de arquivos no banco. Não usar dados pessoais em logs. Não confiar apenas na validação do frontend. Não aceitar tenant vindo do cliente sem conferir no servidor. Não publicar o produto para novas prefeituras enquanto o isolamento não for testado com dois tenants.
