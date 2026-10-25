# Runtime configuration

No personal contact, privileged email or credential belongs in source control.

## Private platform server

Required:
- `FIREBASE_SERVICE_ACCOUNT_JSON`: service-account JSON for the BaticAmigo Firebase project. Store only in the deployment secret mechanism.
- `FIREBASE_ADMIN_EMAILS`: comma-separated bootstrap administrator emails. Empty/unset means **no bootstrap email administrators**. A persisted `platform_accounts` record is authoritative once it exists.

Operational readiness variables are validated by `npm run check:production-readiness`; values such as RPO/RTO, policy approvals and review dates must come from approved evidence, never defaults.

## Legacy Firebase Functions mail

Existing legacy functions read mail credentials/settings from Firebase Functions config. The contact notification recipient must be configured as:
- `email.contact_to`

The sender remains:
- `email.user`

The function fails closed for contact notifications when `email.contact_to` is missing or invalid; no recipient is hardcoded in the repository.

## Public Firebase web configuration

Firebase web API keys/project identifiers are client configuration, not server secrets. The application must not add Analytics/Measurement identifiers unless tracking has been explicitly reviewed and approved.

## Deployment acceptance

Before production:
1. configure secrets/settings in the target platform;
2. run the production validation checklist;
3. confirm Rules/IAM in the real environment;
4. record the exact SHA and evidence;
5. do not copy secret values into GitHub, Notion or CI logs.
