# Materialize recurring quests on schedule

A completed Recurring Quest produces one new Quest Occurrence at the first matching household-local schedule, rather than creating it immediately with a future date. A per-minute idempotent job materializes that successor and catches up once after downtime; skipping stops the chain. This keeps future work out of the active Quest Log while preserving each completed occurrence as history.
