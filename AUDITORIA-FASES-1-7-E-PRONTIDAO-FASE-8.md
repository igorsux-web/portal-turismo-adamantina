# Auditoria das Fases 1–7 e prontidão para a Fase 8

**Projeto:** Portal de Turismo Municipal — Viva Adamantina  
**Data da auditoria:** 19 de setembro de 2026  
**Escopo:** requisitos levantados na descoberta, checkpoints anteriores, schema, API tRPC, telas, testes, documentação e estado operacional do projeto.

## 1. Conclusão executiva

O projeto deixou de ser um protótipo visual e já possui uma base funcional relevante. O portal público consulta catálogo, eventos, roteiros e mapas reais. O painel administrativo possui autenticação delegada, papéis de acesso, moderação, relatórios, presença por QR Code, galerias e dados privados protegidos.

A auditoria, porém, não recomenda considerar as sete fases completamente encerradas. O estado correto é **produto funcional em homologação técnica, ainda não pronto para comercialização institucional**. As principais lacunas estão concentradas em quatro áreas:

1. **Fase 7 incompleta:** MFA institucional, backups testados, monitoramento, rate limiting, proteção CSRF e política operacional de retenção ainda não foram implementados ou configurados.
2. **Segurança de convites e permissões:** tokens de convite estão armazenados em texto, a aceitação não é transacional e moderadores ainda podem publicar diretamente conteúdos em algumas mutações.
3. **Funcionalidades administrativas:** o item “Presença & QR Codes” do menu abre um placeholder, embora existam APIs e funções relacionadas distribuídas em outros módulos.
4. **Fase 8 ainda não iniciada tecnicamente:** o tenant é resolvido por `slug` recebido na aplicação. Ainda não há resolução por domínio/subdomínio, configuração de marca por prefeitura ou isolamento operacional baseado no host.

O próximo passo recomendado não é iniciar imediatamente a comercialização multi-tenant. Primeiro devem ser fechados os itens **P0 e P1** desta auditoria. A Fase 8 pode começar em paralelo apenas com o desenho técnico de domínio e branding, sem publicar novas prefeituras antes da correção dos riscos críticos.

## 2. Legenda de situação

| Situação | Significado |
| --- | --- |
| **Concluído** | Existe implementação persistente, proteção de acesso e validação mínima compatível com o escopo. |
| **Parcial** | A base existe, mas falta uma parte relevante para o requisito ser considerado pronto para produção. |
| **Pendente** | O requisito ainda não está implementado ou não foi validado. |
| **Dependente da prefeitura** | A implementação pode estar preparada, mas depende de decisão, credencial, contrato, dado ou política institucional. |
| **Fora do MVP atual** | Foi deliberadamente deixado para uma etapa posterior, sem caracterizar defeito da versão web. |

## 3. Matriz por fase

| Fase | Resultado encontrado | Situação | Pendências principais |
| --- | --- | --- | --- |
| 1. Dados reais e fundação | Banco multi-tenant, tenant Adamantina, catálogo, eventos, autenticação e dashboard conectados | **Parcialmente concluído** | Ainda há decisões institucionais não confirmadas e a resolução real por domínio não existe |
| 2. Portal público | Fichas, eventos, mapa, filtros e calendário consultam API pública | **Concluído para web** | Falta inserir e validar a base real de Adamantina; SEO e compartilhamento social não foram tratados como requisito comercial |
| 3. Moderação e contribuições | Avaliações, comentários e contribuições são persistidos como pendentes e passam por fila | **Parcial** | Auditoria não cobre todas as alterações; moderador pode publicar diretamente em algumas mutações; faltam limites contra abuso |
| 4. Conta e roteiros | Perfil de visitante, roteiros pessoais, roteiros oficiais e controles de propriedade existem | **Parcial** | Consentimentos, exportação/exclusão de dados do titular e política de retenção ainda não estão implementados |
| 5. Presença, QR e relatórios | Deduplicação, expiração, revogação, filtros e exportações existem | **Parcial** | Não há restrição estrutural contra corrida concorrente; o módulo próprio do menu administrativo ainda é placeholder; retenção e governança dos dados não foram aplicadas |
| 6. Cadastro rico e privacidade | Perfis por categoria, Cadastur manual, galeria, consentimento e CPF cifrado existem | **Parcial** | Não há integração oficial com Cadastur/SISMAPA; não há limpeza de metadados de imagem; objetos removidos podem permanecer no storage; validação institucional dos dados ainda falta |
| 7. Segurança e operação | Sessão de 12 horas, cookies ajustados, headers, limite de payload, validação de upload e documentação inicial foram adicionados | **Parcial** | MFA, backup, restauração, monitoramento, rate limiting, CSRF, gestão de segredos e testes de segurança continuam pendentes |
| 8. Multi-tenant comercial | Schema e isolamento lógico por `tenantId` existem | **Não iniciada** | Domínio/subdomínio, branding, configuração por município, onboarding e operação comercial ainda não existem |

## 4. Auditoria funcional detalhada

### 4.1 Portal público e catálogo

O portal já removeu os arrays de fallback de locais e eventos das páginas de negócio. As consultas públicas retornam locais aprovados, eventos futuros, marcadores geográficos, mídias públicas e detalhes. Isso atende ao núcleo do portal web responsivo.

O catálogo, entretanto, ainda não representa uma ficha institucional completa para todas as categorias previstas na descoberta. O modelo possui categorias genéricas e uma tabela `placeProfiles` com campos para hospedagem, gastronomia, atrativos e acessibilidade. Não há modelagem dedicada para transporte, espaços culturais, artesanato ou outros setores com necessidades próprias. Esses itens podem ser cadastrados como categoria e texto livre, mas não geram indicadores específicos nem validações próprias.

A base real de Adamantina ainda precisa ser levantada com a Secretaria. O registro existente no ambiente de desenvolvimento não deve ser tratado como base homologada. Também não há comprovação de que endereço, telefone, horários, capacidade, acessibilidade e situação do Cadastur foram validados por um responsável municipal.

### 4.2 Eventos, agenda e presença

A agenda pública e as fichas de evento estão ligadas ao banco. A presença exige autenticação, aceita portal ou QR Code e coleta origem de forma opcional e agregável. A consulta impede eventos não publicados e QR Codes inativos ou expirados.

Há, contudo, três pontos pendentes. Primeiro, a deduplicação é feita por consulta seguida de inserção. Sem uma restrição única adequada no banco, duas requisições concorrentes podem eventualmente criar registros duplicados. Segundo, não há política de retenção ou anonimização operacional para os registros de origem. Terceiro, o menu administrativo “Presença & QR Codes” não renderiza uma tela própria; `AdminModuleScreen` apresenta a mensagem de que o módulo será conectado na próxima fase. A API relacionada existe, mas a experiência administrativa está incompleta.

### 4.3 Contribuições, avaliações, comentários e moderação

O ciclo de submissão existe e os conteúdos enviados por visitantes entram como pendentes. Avaliações e comentários aprovados tornam-se públicos, e novas contribuições de locais/eventos podem ser aprovadas.

O modelo de permissão ainda não corresponde completamente ao desenho institucional definido na descoberta. A procedure `municipalAdminProcedure` autoriza administradores municipais, moderadores e administradores da plataforma. As mutações de criação e edição de locais/eventos recebem o campo `status`, o que permite que um moderador com acesso à mutação possa, dependendo do payload, criar ou alterar um conteúdo diretamente para `approved`. A regra recomendada é separar **editar**, **moderar** e **publicar**, permitindo publicação apenas ao administrador municipal ou a uma decisão explícita de moderação registrada.

Também faltam limites de frequência, detecção de conteúdo abusivo e proteção contra repetição automatizada de avaliações, comentários e submissões. A autenticação reduz o abuso, mas não substitui rate limiting, limites por usuário e mecanismos de revisão.

### 4.4 Conta do visitante e direitos do titular

A área “Minha conta” armazena perfil, cidade de origem, interesses e visibilidade privada por padrão. Roteiros pessoais verificam o proprietário antes de consultar, editar ou excluir.

Para uma operação conforme a LGPD, ainda faltam funções de titular: solicitar exportação dos dados, solicitar exclusão quando legalmente possível, retirar consentimento, consultar a finalidade dos dados de presença e visualizar a política de privacidade no momento da coleta. A ausência dessas funções não impede o protótipo, mas impede declarar conformidade operacional completa.

### 4.5 Relatórios e exportações

Os relatórios têm filtros por período e evento, agregação de origem, comparação entre municípios para administradores da plataforma e exportação CSV/PDF. Os dados principais consultados são agregados.

É necessário revisar os arquivos exportados em homologação para confirmar que nenhuma coluna administrativa ou dado pessoal foi incluído por acidente. Também é necessário registrar quem exportou cada relatório e para qual município. Hoje a auditoria não cobre todas as consultas ou exportações.

### 4.6 Cadastur, SISMAPA e integrações

O projeto possui armazenamento de número e status de Cadastur no cadastro de locais. Isso é uma **estrutura manual de registro e validação**, não uma integração oficial. Não foi encontrada implementação de consulta ou sincronização com Cadastur.

Não foi encontrada integração com SISMAPA. Como não houve especificação técnica, credencial ou edital fornecido, essa lacuna deve ser tratada como dependência de descoberta institucional, não como falha de código. Antes de implementar, será necessário confirmar quais dados a prefeitura pode consultar, qual órgão fornece acesso e quais campos devem ser sincronizados.

O Resend possui estrutura preparada, mas permanece sem envio real enquanto remetente e chave não forem configurados. Portanto, convites por e-mail institucional continuam **dependentes da prefeitura**.

## 5. Auditoria de segurança e LGPD

### 5.1 Controles existentes

A aplicação usa Manus OAuth, procedure protegida para chamadas autenticadas, papéis administrativos, verificação de tenant, armazenamento externo para mídia, validação de assinatura binária de imagens, limite de tamanho e criptografia AES-256-GCM para CPF de responsáveis.

O hardening HTTP atual adiciona `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, política CSP restrita ao framing oficial e HSTS em HTTPS. O corpo das requisições foi reduzido para 8 MB e a sessão local foi reduzida para 12 horas.

Esses controles são positivos, mas não equivalem a um programa completo de segurança institucional.

### 5.2 Pendências críticas de segurança

| Prioridade | Pendência | Evidência ou impacto |
| --- | --- | --- |
| **P0** | MFA de administradores | A autenticação delegada não impõe MFA pela aplicação. O provedor institucional ainda não foi escolhido. |
| **P0** | Backups e restauração | Não há rotina externa configurada nem teste de restauração. Perda de banco ou storage ainda não possui procedimento validado. |
| **P1** | Proteção CSRF/Origin | O cookie HTTPS usa `SameSite=None` para compatibilidade OAuth. Mutations administrativas precisam de validação de `Origin`/`Referer` ou token CSRF explícito. |
| **P1** | Rate limiting | Não há limite por IP, usuário ou tenant para login indireto, convites, submissões, comentários, presença e upload. |
| **P1** | Tokens de convite | O token é armazenado em texto na tabela `invitations`. Se o banco for exposto, convites ainda válidos podem ser utilizados. Deve-se armazenar apenas hash do token e comparar por hash. |
| **P1** | Aceitação de convite | A atualização do usuário e a marcação do convite como aceito não estão encapsuladas em transação nem protegidas por condição atômica. Há risco de corrida em aceites simultâneos. |
| **P1** | Auditoria abrangente | Há logs de revisão, convites e alteração de usuários, mas criação/edição de locais, eventos, perfis, responsáveis, exclusões, QR Codes, exportações e alterações de permissões não têm cobertura uniforme. |
| **P1** | Separação de publicação | Moderadores têm acesso a mutações que aceitam `status` arbitrário, inclusive publicação direta. |
| **P2** | Metadados de imagem | A validação confirma o formato, mas não remove EXIF. Fotos podem carregar localização ou informações do dispositivo. |
| **P2** | Orphaned storage | A exclusão remove a referência no banco, mas o helper de storage não remove o objeto. É preciso definir rotina de limpeza e retenção. |
| **P2** | Segredos | O código lê `JWT_SECRET` e chaves de integração, mas ainda não há processo institucional documentado de rotação e segregação por ambiente. |
| **P2** | Monitoramento | Não há health check institucional, alerta de erro, detecção de falhas administrativas ou painel de disponibilidade. |
| **P2** | Testes | Existem quatro arquivos de teste e seis casos automatizados. Ainda faltam testes de tenant, CSRF, rate limiting, upload abusivo, concorrência, convite e exportação sem dados pessoais. |

## 6. Auditoria multi-tenant e prontidão para a Fase 8

O isolamento lógico por `tenantId` está presente em grande parte do schema e dos helpers. A procedure `ensureTenantAccess` impede que usuários municipais acessem outro município por slug. Administradores da plataforma podem consultar múltiplos tenants em relatórios comparativos.

A arquitetura ainda não é comercial multi-tenant completa. O slug do município é enviado pelo frontend e possui valor padrão `adamantina`. A aplicação não resolve o tenant a partir de `Host`, `X-Forwarded-Host` validado ou configuração de domínio. Também não existem:

- tabela de domínios associados ao tenant;
- domínio canônico e redirecionamento por município;
- configurações de marca, logo, cores e textos institucionais por tenant;
- página de onboarding municipal;
- processo de criação e suspensão de tenant pela plataforma;
- controles de publicação por domínio;
- configuração de e-mail, mapas, políticas e contatos por prefeitura;
- suíte de testes que prove isolamento entre dois municípios reais.

A Fase 8 deve começar pelo desenho de resolução de tenant e branding, mas sua implementação deve ser precedida por testes de isolamento com pelo menos dois tenants fictícios e pela conclusão dos itens P0/P1 de segurança.

## 7. Pendências institucionais, de dados e de produto

Algumas pendências não podem ser resolvidas apenas com código:

- confirmar oficialmente se Turismo e Cultura permanecerão na mesma secretaria;
- obter a base de atrativos, hotéis, pousadas, restaurantes, comércio, cultura e eventos de Adamantina;
- definir o responsável municipal pelo conteúdo e pela validação do Cadastur;
- identificar o encarregado ou DPO e o setor jurídico;
- aprovar política de privacidade, retenção e descarte;
- definir a infraestrutura de produção, domínio, DNS, banco, storage e backups;
- contratar/configurar remetente institucional e chave do Resend;
- definir o provedor de identidade com MFA;
- confirmar as exigências do edital quando ele for publicado;
- confirmar o uso, a finalidade e o acesso permitido para SISMAPA;
- definir o contrato de suporte, SLA, responsabilidade por dados e procedimento de encerramento de tenant.

Esses itens são requisitos de implantação e governança. Sem eles, o sistema pode ser demonstrado, mas não deve ser apresentado como solução institucional homologada.

## 8. Plano recomendado antes e durante a Fase 8

### Bloco 1 — Correções obrigatórias antes da comercialização

1. Implementar validação de `Origin`/CSRF para mutations autenticadas.
2. Hash de tokens de convite, aceite atômico e invalidação imediata.
3. Separar permissão de edição e publicação.
4. Adicionar rate limiting por IP, usuário e tenant.
5. Completar auditoria para operações administrativas críticas e exportações.
6. Criar testes automatizados de tenant, convite, concorrência e ausência de dados pessoais em exportações.

### Bloco 2 — Fechamento operacional da Fase 7

1. Escolher o provedor de identidade com MFA obrigatório para administradores.
2. Configurar backups do banco e inventário de mídia.
3. Executar e registrar teste de restauração.
4. Configurar health check, logs centralizados e alertas.
5. Formalizar retenção, descarte, atendimento ao titular e resposta a incidentes.
6. Revisar imagens para remoção de EXIF e definir limpeza de objetos órfãos.

### Bloco 3 — Fase 8

1. Criar entidade de domínios e domínio canônico por tenant.
2. Resolver tenant pelo host validado, mantendo slug apenas como fallback de desenvolvimento.
3. Criar configurações de marca e identidade visual por município.
4. Aplicar configuração de contatos, políticas, e-mail e integrações por tenant.
5. Criar fluxo de onboarding e checklist de homologação municipal.
6. Testar dois tenants com dados semelhantes e provar que nenhum usuário municipal atravessa o limite do próprio município.

## 9. Veredito de prontidão

| Uso | Veredito |
| --- | --- |
| Demonstração interna | **Apto**, desde que se usem dados de teste ou dados já autorizados |
| Homologação técnica controlada | **Apto com ressalvas**, após registrar os itens P0/P1 como bloqueadores |
| Publicação pública de Adamantina | **Não recomendado ainda** sem MFA institucional, backup testado, política LGPD aprovada e base real validada |
| Venda para múltiplas prefeituras | **Não apto ainda**; depende da Fase 8 e das correções de segurança |
| Uso de dados pessoais de responsáveis | **Apto apenas em ambiente controlado**, com acesso restrito e finalidade documentada |

## 10. Conclusão

O trabalho realizado nas Fases 1–6 formou uma base sólida de produto web. A Fase 7 começou corretamente, mas seu primeiro incremento foi apenas o hardening técnico inicial. O próximo trabalho deve ser uma **Fase 7.1 de fechamento de segurança e governança**, não uma expansão indiscriminada de funcionalidades.

Depois disso, a Fase 8 poderá transformar o piloto de Adamantina em uma plataforma multi-tenant de fato. A prioridade deve ser preservar isolamento, rastreabilidade e capacidade de operação antes de adicionar novos municípios ou vender o sistema como serviço institucional.

## Referências internas

[1]: ./drizzle/schema.ts "Schema multi-tenant, catálogo, eventos, presença, auditoria e convites"
[2]: ./server/routers.ts "Procedures tRPC públicas, administrativas e de autorização"
[3]: ./server/db.ts "Helpers de persistência, relatórios, convites e auditoria"
[4]: ./server/_core/oauth.ts "Fluxo OAuth e criação de sessão"
[5]: ./server/_core/cookies.ts "Opções dos cookies de sessão"
[6]: ./server/security.ts "Headers HTTP e política CSP"
[7]: ./FASE-7-SEGURANCA-E-LGPD.md "Documentação inicial de segurança, LGPD, MFA e backups"
[8]: ./CONTINUAR-NO-VSCODE.md "Instruções para continuidade local do projeto"
