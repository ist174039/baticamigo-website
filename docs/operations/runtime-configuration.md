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


## Release-bound readiness evidence

A production candidate must set evidence metadata for the exact release being assessed. Values are identifiers/references only; never put secret values in these variables.

Required by `npm run check:production-readiness` in addition to the policy/QA checks:
- `BATIC_RELEASE_SHA`: exact 40-character Git SHA under assessment;
- `BATIC_FIRESTORE_RULES_DEPLOYED_SHA` and `BATIC_STORAGE_RULES_DEPLOYED_SHA`: must equal `BATIC_RELEASE_SHA`;
- `BATIC_PRODUCTION_DEPLOYED_SHA`: must equal `BATIC_RELEASE_SHA`;
- `BATIC_PRODUCTION_DEPLOYMENT_URL`: HTTPS production URL;
- `BATIC_PRODUCTION_DOMAIN_VALIDATED_AT`: date of domain/TLS/smoke validation;
- `BATIC_ROLLBACK_VALIDATED_AT`: date rollback was validated;
- `BATIC_READINESS_REVIEWER`: accountable reviewer identity/role reference;
- `BATIC_READINESS_EVIDENCE_URL`: HTTPS link to the consolidated evidence record.

Syntactic passage of this command is not permission to fabricate evidence. Each value must point to an approved record for the same release SHA.


### Repository and public-asset governance
- `BATIC_REPOSITORY_GOVERNANCE_APPROVED_AT`: date on which repository visibility, licensing/ownership and review governance were approved.
- `BATIC_ASSET_RIGHTS_APPROVED_AT`: date on which provenance/rights for all assets in `docs/asset-rights.json` were approved.

These values are evidence references only. Do not set them to make the gate pass before the corresponding decisions/evidence exist.
