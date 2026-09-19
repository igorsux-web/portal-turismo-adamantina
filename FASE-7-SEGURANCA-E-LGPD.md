# Fase 7 — Segurança, LGPD e operação institucional

## Objetivo

Esta fase estabelece o baseline técnico de segurança do Portal de Turismo Municipal. O sistema trata dados de visitantes, servidores, comerciantes e responsáveis por estabelecimentos; portanto, deve aplicar minimização, finalidade, controle de acesso, rastreabilidade e proteção criptográfica conforme a LGPD e as políticas da prefeitura.

## Controles implementados nesta entrega

| Controle | Implementação | Resultado esperado |
| --- | --- | --- |
| Sessão absoluta | Tokens OAuth locais passam a expirar em 12 horas | Reduz exposição de sessões administrativas esquecidas |
| Cookie de sessão | `HttpOnly`; `SameSite=None` somente em HTTPS; `Lax` em HTTP local | Evita cookies rejeitados em desenvolvimento e reduz risco de envio cross-site |
| Headers HTTP | `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, CSP de framing e HSTS em HTTPS | Diminui riscos comuns de clickjacking, MIME sniffing e vazamento de referrer |
| Superfície Express | `X-Powered-By` desabilitado e body parser limitado a 8 MB | Reduz exposição de tecnologia e consumo abusivo de memória |
| Uploads | MIME permitido por lista, assinatura binária verificada, limite de 5 MB e limite de 30 imagens por galeria | Impede extensão enganosa, conteúdo incompatível e crescimento sem controle |
| Isolamento de tenant | Uploads precisam apontar para local/evento existente no município autenticado | Evita anexação de conteúdo em entidade de outro município |
| Auditoria | Convites e alterações de usuários administrativos são registrados sem guardar o token ou o e-mail completo | Mantém rastreabilidade com minimização de dados pessoais |
| Dados privados | CPF de responsável permanece cifrado com AES-256-GCM e o acesso é restrito a administrador municipal/plataforma | Reduz exposição de dado pessoal identificável |

## Regras operacionais obrigatórias

1. O `JWT_SECRET` deve ser um segredo aleatório forte, exclusivo por ambiente e nunca deve ser versionado.
2. O ambiente de produção deve usar HTTPS obrigatório, domínio institucional e cookies seguros.
3. Administradores devem usar contas institucionais e o acesso deve ser revogado imediatamente quando houver troca de função.
4. Relatórios devem apresentar dados agregados. Não devem exportar CPF, e-mail, telefone ou identificadores individuais de visitantes.
5. O município deve definir prazo de retenção para presenças, contribuições, logs e convites com apoio do encarregado/DPO ou jurídico.
6. Backups devem ser criptografados, ter retenção definida, acesso restrito e teste periódico de restauração. Backup sem teste de restauração não é considerado validado.
7. O storage deve ser tratado como repositório de mídia; referências removidas do banco não devem ser reutilizadas em fichas públicas.

## MFA e identidade

A autenticação atual é delegada ao Manus OAuth. A aplicação não deve criar um segundo formulário de senha nem armazenar segredos TOTP enquanto o provedor institucional não estiver definido. Para produção, a prefeitura deve escolher uma destas políticas:

- exigir MFA no provedor OAuth para todos os administradores; ou
- integrar um provedor OIDC/SAML institucional que imponha MFA e permita revogação centralizada.

A política deve ser validada antes da homologação. Implementar TOTP internamente sem recuperação, rotação, auditoria e suporte institucional criaria um risco maior do que o benefício.

## Backups e continuidade

O banco e o storage devem ter rotinas separadas: backup lógico ou snapshot do banco e inventário das chaves de mídia. A frequência, retenção, região, responsável e procedimento de restauração devem ser definidos com o provedor de hospedagem e formalizados em contrato. Não há um backup externo automático configurado nesta fase porque isso depende da infraestrutura contratada pela prefeitura e de credenciais que ainda não foram fornecidas.

## Pendências para concluir a Fase 7

- Definir o provedor de identidade que imporá MFA para administradores.
- Configurar gestão de segredos e rotação do `JWT_SECRET` em produção.
- Definir política de retenção e descarte com o jurídico/DPO.
- Configurar backup automático do banco e teste de restauração.
- Adicionar monitoramento de disponibilidade, erros e tentativas administrativas anômalas.
- Executar teste de autorização por perfil e tenant em ambiente de homologação.
