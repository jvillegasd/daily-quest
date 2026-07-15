BEGIN;

UPDATE "Household"
SET "timezone" = 'America/Bogota'
WHERE "id" = 'cmqbzg7tl000101mm445sgn7w';

UPDATE "Task"
SET "recurrenceRule" = '0 9 * * 0'
WHERE "householdId" = 'cmqbzg7tl000101mm445sgn7w'
  AND "type" = 'RECURRING'
  AND btrim(coalesce("recurrenceRule", '')) = '';

COMMIT;
