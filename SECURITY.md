# Security Policy

## Reporting a vulnerability

Please do **not** open a public GitHub issue with vulnerability details, credentials, personal data, data about children/families, or reproduction data from production.

Use the security contact published by the application at:

- https://baticamigo.pt/.well-known/security.txt

The current public contact route resolves to the association contact section. If the production domain is unavailable, contact the association through an already approved private channel rather than publishing exploit details.

## Scope

Security reports may cover:
- authentication and authorization;
- access between profiles/families/students;
- API and Firebase boundaries;
- file upload/download handling;
- public CMS/content boundaries;
- privacy/security logging;
- deployment/configuration issues.

Do not test against real accounts, children/families, or production data without explicit authorization.

## Response handling

Reports are triaged using the incident model under `docs/operations/recovery-and-incidents.md` and `lib/platform/incident.mjs`.

This repository does not promise a bug-bounty payment, response SLA, or safe-harbor terms unless the association explicitly approves and publishes them.

## Sensitive information

Never commit:
- service-account JSON or credentials;
- tokens/passwords;
- private contact lists;
- member/family/student records;
- financing/contract data;
- production exports or screenshots containing personal data.

If sensitive material is accidentally committed, revoking/rotating the credential or access path is required; deleting the Git history alone is not sufficient.
