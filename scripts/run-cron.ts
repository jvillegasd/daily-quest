import { runDailyNotifications } from '@/lib/jobs/daily-notifications'
import { tasksService } from '@/lib/services/tasks.service'

// Stand-alone entrypoint executed by the Coolify Scheduled Task (no HTTP, no secret).
// Bundled at build time to scripts/run-cron.cjs (see Dockerfile) and run with
// `node scripts/run-cron.cjs` inside the already-running app container.
const job = process.argv[2] ?? 'notifications'

const run = job === 'notifications'
  ? runDailyNotifications
  : job === 'recurrences'
    ? tasksService.generateDueRecurrences
    : () => Promise.reject(new Error(`Unknown cron job: ${job}`))

run()
  .then((result) => {
    console.log(`[cron] ${job} completed`, result)
    process.exit(0)
  })
  .catch((error) => {
    console.error(`[cron] ${job} failed`, error)
    process.exit(1)
  })
