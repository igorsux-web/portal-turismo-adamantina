# Decisões da Fase 7.1 — Operação, MFA e LGPD

## Status

Este documento registra decisões provisórias para desenvolvimento e homologação do Portal de Turismo de Adamantina. Antes da entrada em produção municipal, o DPO, o setor jurídico e o responsável pela infraestrutura deverão validar os prazos e procedimentos.

## Autenticação administrativa

O login será feito pelo Google OAuth. Durante o desenvolvimento serão utilizadas contas Gmail. A política recomenda que administradores ativem a verificação em duas etapas da própria conta Google, mas o portal não consegue comprovar tecnicamente esse estado em contas Gmail comuns. A imposição técnica deverá ser feita quando a prefeitura utilizar contas Google Workspace ou Cloud Identity gerenciadas.

O painel administrativo permanece restrito a contas que tenham recebido e aceitado um convite válido. O convite não concede acesso por si só; o usuário precisa autenticar-se e concluir o aceite.

## Backups

A política operacional de produção ainda não foi definida. Fica registrada como recomendação técnica um backup diário do banco, retenção mínima de 30 dias, cópia criptografada em localização distinta e teste mensal de restauração. A contratação da infraestrutura deverá definir o provedor, os responsáveis, o RPO, o RTO e o procedimento de restauração.

Nenhuma rotina automática de eliminação ou restauração será ativada com base apenas neste documento.

## Monitoramento

O endpoint `/healthz` já existe para verificação de disponibilidade. O destinatário técnico provisório para alertas será `igor.sux@gmail.com`. Em produção, o endereço deverá ser substituído por uma caixa institucional ou pelo canal definido no contrato de manutenção.

Os alertas mínimos deverão cobrir indisponibilidade, falha de conexão com o banco, falhas repetidas de autenticação e esgotamento de armazenamento. O mecanismo de envio e a ferramenta de monitoramento serão escolhidos na contratação da infraestrutura.

## Retenção provisória

Durante desenvolvimento e homologação, aplicar como referência, sem exclusão automática:

| Registro | Retenção provisória | Observação |
|---|---:|---|
| Logs técnicos | 90 dias | Reduzir exposição e custo; acesso restrito à manutenção. |
| Auditoria administrativa | 5 anos | Validar com jurídico e regras de transparência. |
| Presenças agregadas | 5 anos | Manter somente dados necessários aos indicadores turísticos. |
| Solicitações LGPD | 5 anos | Ajustar ao prazo jurídico aplicável. |
| Dados pessoais desnecessários | Anonimização após atendimento | Respeitar obrigações legais de retenção. |

Os prazos definitivos dependem de validação do DPO e do jurídico municipal. Dados de desenvolvimento não devem ser utilizados como base oficial para relatórios ou pleitos de recursos.

## Direitos do titular

A área Minha conta possui fluxos para exportação dos dados, solicitação de exclusão e retirada de consentimentos opcionais. Solicitações de exclusão ficam registradas e devem ser analisadas pela Ouvidoria quando houver obrigação legal, necessidade de prestação de contas ou outra hipótese de retenção.
