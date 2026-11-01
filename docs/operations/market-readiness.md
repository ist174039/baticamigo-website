# Market readiness scoring model

This model makes the project progress number reproducible. It does **not** replace the production-readiness gate and it does not turn technical evidence into legal, organizational or operational approval.

## Metrics

- **Functional** — implemented functional requirements / total functional requirements.
- **Documentation** — canonical PDD sections and operational tables reconciled to the checkpoint SHA.
- **Architecture** — as-built components, APIs, integrations, ADRs, data boundaries and sequences reconciled to the checkpoint SHA.
- **Requirements Coverage** — canonical requirements represented in the evidence manifest / canonical requirements.
- **Tests** — automated gate plus all required manual/external validation. Automated green alone cannot score 100 while manual/external requirements remain.
- **Evidence** — applicable controls whose required evidence mode is complete. Technical controls require green CI; manual, external and operational controls require their corresponding evidence records.
- **Risks** — material risks resolved or formally accepted with owner, treatment, evidence and acceptance criterion.
- **Traceability** — requirements with implementation evidence paths / canonical requirements.
- **Delivery Readiness** — satisfied checks from the 15-item fail-closed production-readiness gate.

## Weights

Functional 15%; Documentation 10%; Architecture 10%; Requirements Coverage 10%; Tests 10%; Evidence 15%; Risks 10%; Traceability 10%; Delivery Readiness 10%.

## Release interpretation

Ready for Main requires the branch to be internally consistent, reviewed, traceable and green. Ready for Production additionally requires all 15 production-readiness checks and an explicit GO decision. A weighted score cannot override a blocking gate.
