WITH ranked AS (
  SELECT p.id, ROW_NUMBER() OVER (PARTITION BY p."householdId" ORDER BY p."createdAt", p.id) AS rn
  FROM "Profile" p
  WHERE p."householdId" IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM "Profile" admin
      WHERE admin."householdId" = p."householdId"
        AND admin.role = 'ADMIN'::"Role"
    )
)
UPDATE "Profile" p
SET role = 'ADMIN'::"Role"
FROM ranked r
WHERE p.id = r.id AND r.rn = 1;
