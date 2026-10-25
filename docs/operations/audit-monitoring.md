# Audit monitoring and security-event triage

## Event metadata

Every server-mediated audit record carries:
- `actorUid`
- bounded `action`
- bounded `target`
- `severity`: low / medium / high
- `securityRelevant`
- `category`
- allowlisted, size-bounded detail fields
- server timestamp

No record payload snapshots, donor names, free-text messages, file contents or credentials are copied to the audit stream.

## Triage baseline

**High / access-control**
- access-profile changes;
- user-role/access changes;
- suspension/restoration;
- account deletion;
- temporary password generation;
- invitation/reset actions.

**Medium**
- other identity mutations;
- destructive data mutations;
- finance mutations.

**Low security-relevant**
- student attendance/assessment/justification changes where applicable.

## Operational follow-up

A production alert channel is not inferred from this repository. Before GO, define:
- owner/on-call recipient;
- delivery mechanism;
- acknowledgement target by severity;
- deduplication/escalation;
- retention;
- evidence of a successful test alert.

Until that evidence exists, this control is technical detection readiness, not proof of live monitoring.
