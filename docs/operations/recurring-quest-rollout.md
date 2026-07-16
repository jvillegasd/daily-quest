# Recurring quest rollout

After deploying the recurrence migration, run `scripts/repair-production-recurrences.sql` once against the Daily Quest production database. It sets the existing Family household to `America/Bogota` and repairs its three blank recurring schedules to Sunday at 09:00.

Verify the repair with:

```sql
SELECT "timezone" FROM "Household" WHERE "id" = 'cmqbzg7tl000101mm445sgn7w';
SELECT "status", "recurrenceRule", count(*)
FROM "Task"
WHERE "householdId" = 'cmqbzg7tl000101mm445sgn7w' AND "type" = 'RECURRING'
GROUP BY "status", "recurrenceRule";
```

Expected: timezone `America/Bogota`; three rows using `0 9 * * 0`. Recurring successors now use scheduled visibility and require no recurrence job.

The migration retains the legacy generation marker temporarily. On the household's next quest read, the app creates exactly one missing successor at its real scheduled time and marks the old occurrence reconciled. This prevents rollout-time data loss without a background recurrence job or a backlog.
