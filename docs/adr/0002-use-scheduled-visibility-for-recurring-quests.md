---
status: accepted
---

# Use scheduled visibility for recurring quests

Completing a Recurring Quest immediately creates its successor with a future `availableAt`, and task queries hide it until that timestamp. This replaces per-minute materialization with a durable database record, so deploys and downtime cannot miss an occurrence and no recurrence worker is required; assignment notification is sent when the successor is scheduled. Completed occurrences left by the retired worker are reconciled once, using the same schedule calculation, when their household next reads its quests.
