import { execSync } from 'child_process'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const TEST_DB_URL = 'postgresql://postgres:postgres@localhost:5432/dailyquest_test'

export default async function globalSetup() {
  // Reset the test database
  execSync(
    `DATABASE_URL="${TEST_DB_URL}" npx prisma migrate reset --force --skip-seed`,
    { stdio: 'inherit' }
  )

  // Seed a known E2E test user
  const pool = new Pool({ connectionString: TEST_DB_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  const bcrypt = await import('bcryptjs')
  const hash = await bcrypt.hash('TestPassword123!', 4)

  const user = await prisma.user.create({ data: { email: 'e2e@dailyquest.test', name: 'E2E User' } })
  await prisma.account.create({
    data: {
      userId: user.id,
      type: 'credentials',
      provider: 'credentials',
      providerAccountId: user.email!,
      passwordHash: hash,
    },
  })
  await prisma.profile.create({ data: { userId: user.id, email: user.email!, displayName: 'E2E User' } })

  await prisma.$disconnect()
  await pool.end()
}
