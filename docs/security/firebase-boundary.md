# Firebase security boundary

The BaticAmigo private platform uses a server-mediated security boundary.

## Firestore

- Browser/client direct access to Firestore operational collections is denied by `firestore.rules`.
- The Next.js API authenticates Firebase ID tokens and authorizes roles/relationships server-side.
- Firebase Admin SDK access is controlled by Google Cloud IAM and therefore bypasses Firestore Security Rules by design.
- Production deployment must use the versioned `firestore.rules` from this repository.

## Storage

- Direct client reads/writes are denied by `storage.rules`.
- Uploads pass through the authenticated server API.
- Authorized downloads use short-lived signed URLs generated server-side.
- Production deployment must use the versioned `storage.rules` from this repository.

## Operational evidence still required

Repository configuration is not proof that production currently has the same rules/IAM. Before GO, capture:
1. deployed Firestore rules version/hash;
2. deployed Storage rules version/hash;
3. IAM principals/roles used by the runtime service account;
4. confirmation that no user-facing credential grants broader direct access.

This evidence belongs in the canonical Notion validation records.
