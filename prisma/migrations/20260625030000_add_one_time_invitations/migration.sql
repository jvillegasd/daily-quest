CREATE TABLE "Invitation" (
  "id" TEXT NOT NULL,
  "householdId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");
CREATE INDEX "Invitation_householdId_idx" ON "Invitation"("householdId");

ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_householdId_fkey"
  FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
