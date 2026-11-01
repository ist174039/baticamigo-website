# Login admin regression: partial stored account

## Status

Draft investigation and safe remediation plan. No production account, Firebase record, environment value, or credential was read or changed. No authentication bypass is proposed.

## Evidence

- Production deployment `dpl_Dz7UQLJWqeCBGzyZ5VuCxHw2bESK` is READY on `fdde2658512e876c5c33eea6d67e8e505422c80c`.
- That SHA changes documentation only. It is not itself the functional regression.
- The published application serves `/platform/login` with HTTP 200 and renders the login form.
- The login client signs in with Firebase, then requests `/api/platform` to resolve the account and permitted destinations.
- Current `lib/platform/access.mjs` returns any stored `platform_accounts/{uid}` record before bootstrap email or legacy claims. `lib/platform/server.js` then requires active, unsuspended account state and valid roles.
- The combined Vercel status for the published SHA reports failure due to build rate limit. A green CI result for the exact published SHA is not evidenced.
- Historical runtime logs for the reported login attempt are outside the available retention window.

## Root cause hypothesis

The main account may have an existing partial or migrated `platform_accounts` document without `active: true` or an admin role. Such a document suppresses fallback to the verified bootstrap email and legacy admin claim, then the shared API rejects the account. This is consistent with the regression timing and the reported verification/access message, but is not confirmed without checking the account's actual Firebase record.

Other unresolved possibilities include an unverified Firebase identity, stale token claims, disabled identity, or invalid server-side Firebase Admin configuration.

## Security decision

Do not restore access by falling back to email/claim whenever a stored document exists. This would let suspended, deactivated, or downgraded accounts bypass the persisted revocation decision. Do not relax email verification, session revocation, active/suspended checks, or role authorization.

## Reproducible synthetic test matrix

Use Firebase Auth/Firestore emulators and synthetic identities only:

1. Verified bootstrap admin with no stored account -> admin and area destinations available.
2. Persisted active admin -> admin and area available.
3. Persisted member -> area only.
4. Persisted suspended admin -> denied.
5. Persisted inactive admin -> denied.
6. Persisted partial document for verified bootstrap admin -> denied with a safe, actionable operator-facing error; no elevated destination.
7. Unverified bootstrap identity -> denied and verification required.
8. Legacy admin claim with no stored account -> preserve the explicitly supported legacy behavior.
9. Legacy admin claim with any persisted account record -> persisted record remains authoritative.
10. Expired/revoked token -> 401; no account state is exposed.

Assert that API responses contain no account document data, credentials, or unnecessary personal information.

## Safe recovery sequence

1. An authorized Firebase operator independently verifies the principal UID for the main administrative account and confirms email verification. Do not infer UID from a submitted email or copy tokens into logs.
2. Inspect only that UID's account authorization fields: existence, `active`, `suspended`, `role`, and `roles`. Do not export or share account/profile data.
3. If it is a partial migration record and the responsible owner approves restoration, update only that record to the intended active admin state, with a before/after audit reference. Preserve other fields and do not use a broad email-based grant.
4. If the record is intentionally inactive/suspended/downgraded, stop and obtain an explicit authorization decision.
5. Validate the matrix above in emulators and run the full Quality Gate on the exact candidate SHA.
6. Test the candidate in a protected staging environment using synthetic identities only.
7. Production publication requires separate explicit approval and accepted readiness evidence.

## Acceptance criteria

- Existing active admin still reaches the expected admin and association destinations.
- Verified bootstrap works only when no stored account exists.
- A stored inactive/suspended/member record cannot obtain admin through email or claims.
- Email verification and token revocation checks remain enforced.
- All synthetic tests and CI pass on the candidate SHA.
- The root cause is confirmed or rejected using authorized evidence, without disclosure of account data.
