# Recurring quest rollout

After deploying the recurrence migration, run `scripts/repair-production-recurrences.sql` once against the Daily Quest production database. It sets the existing Family household to `America/Bogota` and repairs its three blank recurring schedules to Sunday at 09:00.

Verify before enabling the `recurring-quests` Coolify task:

```sql
SELECT "timezone" FROM "Household" WHERE "id" = 'cmqbzg7tl000101mm445sgn7w';
SELECT "status", "recurrenceRule", count(*)
FROM "Task"
WHERE "householdId" = 'cmqbzg7tl000101mm445sgn7w' AND "type" = 'RECURRING'
GROUP BY "status", "recurrenceRule";
```

Expected: timezone `America/Bogota`; three rows using `0 9 * * 0`. On the first per-minute run, each completed row gets exactly one catch-up successor while the pending row remains unchanged.
