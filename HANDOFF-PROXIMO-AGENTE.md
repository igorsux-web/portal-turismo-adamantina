# Handoff técnico para o próximo agente

## 1. Identidade do projeto

Este projeto é o **Portal de Turismo Municipal — Viva Adamantina**. Adamantina é o município-piloto. A visão de produto é uma plataforma web responsiva que possa atender várias prefeituras, isolando dados por município.

O portal público permite consultar locais, eventos, roteiros e mapas sem login. Ações como contribuição, avaliação, comentário, criação de roteiro pessoal e presença exigem autenticação. O painel administrativo atende secretaria de Turismo/Cultura e possui papéis de plataforma, administrador municipal, moderador e analista.

O objetivo original é apoiar:

- divulgação turística da cidade;
- cadastro de atrativos, hotéis, pousadas, restaurantes, comércio, cultura, transporte e eventos;
- moderação de contribuições da população;
- roteiros oficiais e personalizados;
- presença por portal e QR Code;
- relatórios institucionais agregados;
- preparação para programas de fomento, Cadastur e possíveis integrações futuras;
- futura comercialização multi-tenant por subdomínio ou domínio próprio.

## 2. Estado exato no momento do handoff

O último checkpoint conhecido é **`226e7aba`**. Ele corrigiu a pré-visualização após o hardening HTTP da Fase 7. O servidor estava respondendo 200 localmente e pela URL pública, e a página inicial foi capturada com sucesso.

A Fase 7 foi iniciada, mas não encerrada. A situação correta é:

> **Produto funcional em homologação técnica; não declarar pronto para comercialização institucional.**

A auditoria completa está em `AUDITORIA-FASES-1-7-E-PRONTIDAO-FASE-8.md`. O plano de execução está em `PLANO-CONTINUIDADE-FASES-7.1-10.md`. Estes dois arquivos devem ser lidos antes de qualquer alteração estrutural.

## 3. Stack e arquitetura atual

- React 19.
- Tailwind CSS 4.
- Express 4.
- tRPC 11.
- Drizzle ORM.
- MySQL/TiDB.
- Manus OAuth no ambiente atual.
- Storage proxy do Manus para mídia.
- Proxy do Google Maps.
- `jspdf` para exportações PDF.
- `qrcode` para QR Codes.
- Vitest para testes.
- Wouter para rotas frontend.

O loop de desenvolvimento é:

1. Alterar `drizzle/schema.ts` se houver mudança de dados.
2. Gerar migração com Drizzle.
3. Aplicar a migração no banco correto.
4. Criar helper em `server/db.ts`.
5. Criar procedure em `server/routers.ts` com autorização de tenant.
6. Consumir a procedure por `trpc.*` no frontend.
7. Adicionar teste.
8. Rodar `pnpm check`, `pnpm test` e `pnpm build`.

## 4. Funcionalidades já existentes

### Portal público

- Página inicial com identidade Viva Adamantina.
- Catálogo público de locais aprovados.
- Fichas públicas de locais e eventos.
- Calendário de eventos futuros.
- Mapa com marcadores de locais e eventos.
- Filtros de locais/eventos no mapa.
- Roteiros oficiais publicados.
- Detalhe de roteiro com mapa e paradas.
- Conta do visitante.
- Roteiros pessoais protegidos por proprietário.
- Página de presença por QR Code.

### Painel administrativo

- Área protegida por autenticação.
- Dashboard com métricas reais.
- CRUD de locais e eventos.
- Moderação de contribuições, avaliações e comentários.
- Roteiros oficiais.
- Gestão de usuários municipais e convites.
- Relatórios por período e evento.
- Relatórios comparativos para administradores da plataforma.
- Exportação CSV/PDF.
- Geração, expiração e revogação de QR Codes.
- Cadastro de perfis específicos de locais.
- Cadastro de responsáveis e licenças.
- Galeria de locais e eventos.

### Segurança já existente

- `protectedProcedure` e `adminProcedure`.
- `ensureTenantAccess` no backend.
- Papéis `platform_admin`, `municipal_admin`, `moderator`, `analyst`, `partner` e `user`.
- CPF de responsáveis criptografado com AES-256-GCM.
- Consentimento obrigatório no cadastro de responsável.
- Upload de JPEG, PNG e WebP com validação de assinatura binária.
- Limite de 5 MB por imagem.
- Limite global de payload de 8 MB.
- Limite de 30 imagens por galeria.
- Cookies `HttpOnly` e `SameSite` coerente com HTTPS/local.
- Sessão OAuth local com expiração de 12 horas.
- Headers HTTP e CSP compatível com o iframe de preview do Manus.
- Auditoria de revisão, convites e alterações de usuários parcialmente implementada.

## 5. Pendências prioritárias conhecidas

### P0 — bloquear publicação

1. MFA obrigatório para administradores.
2. Backup criptografado e teste real de restauração.

### P1 — corrigir antes de comercializar

1. CSRF/validação de `Origin` para mutations por cookie.
2. Rate limiting por IP, usuário e tenant.
3. Hash dos tokens de convite no banco.
4. Aceite de convite transacional e atômico.
5. Auditoria abrangente de operações administrativas.
6. Separação real entre editar, moderar e publicar.
7. Deduplicação de presença protegida contra concorrência.
8. Tela real de “Presença & QR Codes”; atualmente o menu abre placeholder em `AdminModuleScreen`.

### P2 — concluir antes da publicação ampla

1. Remoção de EXIF das imagens.
2. Limpeza ou retenção documentada de objetos órfãos no storage.
3. Rotação de segredos por ambiente.
4. Monitoramento, health check e alertas.
5. Testes de segurança, tenant, convite, concorrência e exportação.
6. Direitos do titular: exportação, exclusão/anonimização e retirada de consentimento.

## 6. Armadilhas importantes

### 6.1 Tenant

O frontend envia `slug`, normalmente com valor padrão `adamantina`. O servidor verifica o tenant por `ensureTenantAccess`, mas a resolução por `Host` ainda não existe. Não trate o slug recebido do cliente como prova de identidade municipal.

Na Fase 8, criar resolução de tenant pelo host validado e testar pelo menos dois municípios fictícios. Nunca remova a validação de `ctx.user.tenantId`.

### 6.2 Permissões

A procedure `municipalAdminProcedure` inclui moderador. Algumas mutações de local/evento aceitam `status`, podendo permitir publicação direta. Corrigir antes de comercializar:

- moderador: revisão e decisão no fluxo de moderação;
- administrador municipal: gestão e publicação institucional;
- analista: leitura e relatórios;
- administrador da plataforma: tenants e operação global.

### 6.3 Convites

A tabela `invitations` contém `token` e o fluxo atual consulta o valor diretamente. Não transportar essa prática para produção. Fazer hash, transação, aceite único e testes de concorrência.

### 6.4 Dados privados

`placeResponsibles.cpfCiphertext` não deve ser retornado ao frontend. A leitura administrativa já foi restringida a `platform_admin` e `municipal_admin`. Preservar essa regra. Não adicionar CPF de visitante para resolver métricas de origem; a decisão original foi minimizar dados.

### 6.5 Upload

O storage do Manus não oferece remoção direta do objeto. A exclusão da referência no banco não necessariamente exclui os bytes. Não prometer exclusão física sem verificar o novo provedor de storage.

### 6.6 Preview

O arquivo `server/security.ts` permite framing apenas para a própria origem e hosts controlados do Manus. Não substituir por `frame-ancestors 'none'` sem considerar o ambiente de preview, pois isso quebra o iframe de visualização.

## 7. Ordem exata de trabalho recomendada

### Etapa A — bootstrap

1. Ler este arquivo.
2. Ler `PLANO-CONTINUIDADE-FASES-7.1-10.md`.
3. Ler `AUDITORIA-FASES-1-7-E-PRONTIDAO-FASE-8.md`.
4. Executar `pnpm install --frozen-lockfile`.
5. Configurar ambiente sem commitar segredos.
6. Executar `pnpm check`, `pnpm test`, `pnpm build`.
7. Confirmar que a página inicial e o painel de login funcionam.

### Etapa B — Fase 7.1

1. Convites com token hash e aceite transacional.
2. Separação de publicação por papel.
3. CSRF/Origin.
4. Rate limiting.
5. Auditoria completa.
6. Presença concorrente e retenção.
7. Tela de presença administrativa.
8. Direitos LGPD do titular.
9. MFA pelo provedor.
10. Backups e restauração.
11. Monitoramento.
12. Testes e checkpoint.

### Etapa C — Fase 8

1. Tabela de domínios.
2. Resolução de tenant pelo host.
3. Branding por tenant.
4. Administração de tenants pela plataforma.
5. Onboarding municipal.
6. Testes com dois tenants.
7. Configuração por tenant de e-mail, mapas e política.
8. Checkpoint.

### Etapa D — Fase 9

1. Coletar dados reais de Adamantina.
2. Importar em staging.
3. Deduplicar e validar localização.
4. Confirmar contatos, horários, acessibilidade e fotos.
5. Validar Cadastur conforme evidência.
6. Publicar somente registros aprovados.
7. Realizar testes com Secretaria, comerciantes e visitantes.
8. Corrigir problemas.

### Etapa E — Fase 10

1. Preparar manuais e políticas.
2. Executar testes técnicos finais.
3. Fazer backup e teste de restauração.
4. Configurar domínio, TLS, MFA, e-mail e monitoramento.
5. Obter aceite formal da Secretaria.
6. Publicar de forma controlada.
7. Ativar suporte, SLA e rotina de atualização.

## 8. Critérios de aceite

### Fase 7.1

- Nenhum P0 ou P1 aberto.
- MFA comprovadamente imposto para administradores.
- Backup restaurado em ambiente separado.
- Convites não reutilizáveis.
- Moderador não publica diretamente.
- CSRF e rate limiting testados.
- Auditoria dos eventos críticos funcionando.
- Testes automatizados ampliados.

### Fase 8

- Dois tenants ativos.
- Dois domínios ou hosts de teste.
- Branding diferente por tenant.
- Usuários municipais não atravessam tenants.
- Plataforma consegue ativar/suspender tenant.
- Adamantina funciona sem depender do slug fixo no fluxo normal.

### Fase 9

- Base real validada por responsável municipal.
- Coordenadas conferidas.
- Fotos autorizadas.
- Cadastur marcado com evidência.
- Eventos reais conferidos.
- Relatórios com dados plausíveis.

### Fase 10

- Aceite formal da Secretaria.
- Política de privacidade aprovada.
- Backup e restauração documentados.
- MFA, TLS, domínio e monitoramento ativos.
- Manual de operação entregue.
- Plano de suporte ativo.

## 9. Arquivos e documentos de referência

- `drizzle/schema.ts`: tabelas e enums.
- `server/db.ts`: acesso ao banco e relatórios.
- `server/routers.ts`: contrato tRPC e autorização.
- `server/_core/trpc.ts`: procedures básicas.
- `server/_core/context.ts`: autenticação por request.
- `server/_core/oauth.ts`: callback OAuth e expiração de sessão.
- `server/_core/cookies.ts`: cookies.
- `server/security.ts`: headers e CSP.
- `server/privateData.ts`: criptografia de dados privados.
- `server/storage.ts`: upload e referências de storage.
- `client/src/App.tsx`: rotas.
- `client/src/pages/Admin.tsx`: painel e placeholder de presença.
- `client/src/pages/AdminCatalog.tsx`: catálogo rico e responsáveis.
- `client/src/pages/AdminEvents.tsx`: eventos e QR Codes.
- `FASE-7-SEGURANCA-E-LGPD.md`: baseline de segurança.
- `AUDITORIA-FASES-1-7-E-PRONTIDAO-FASE-8.md`: auditoria completa.
- `PLANO-CONTINUIDADE-FASES-7.1-10.md`: plano executivo.
- `CONTINUAR-NO-VSCODE.md`: execução fora do Manus.
- `ENVIRONMENT-EXAMPLE.txt`: variáveis sem segredos.

## 10. Entrega para outro agente

Ao receber o projeto, o próximo agente deve responder internamente a estas perguntas antes de codificar:

1. Estou no commit/checkpoint correto?
2. O banco de homologação está separado de qualquer produção?
3. As variáveis reais estão fora do Git?
4. O preview abre sem bloqueio de CSP?
5. `pnpm check`, `pnpm test` e `pnpm build` passam?
6. O problema que vou corrigir está em P0, P1 ou P2?
7. Minha alteração mantém `tenantId` em todas as consultas e mutações?
8. Minha alteração expõe dados pessoais em resposta, log ou exportação?
9. Preciso de nova migração, teste ou atualização documental?
10. Criei checkpoint/tag depois da validação?

Não começar pela Fase 8 de branding ignorando os P0/P1. A ordem acima é parte do requisito de segurança do produto.
