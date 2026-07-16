ALTER TABLE "Task" ADD COLUMN "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX "Task_householdId_status_availableAt_idx" ON "Task"("householdId", "status", "availableAt");
CREATE INDEX "Task_unmaterialized_recurring_idx" ON "Task"("householdId")
WHERE "type" = 'RECURRING' AND "status" = 'DONE' AND "recurrenceGeneratedAt" IS NULL;
