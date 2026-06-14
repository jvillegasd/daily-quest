import { runDailyNotifications } from '@/lib/jobs/daily-notifications'

// Stand-alone entrypoint executed by the Coolify Scheduled Task (no HTTP, no secret).
// Bundled at build time to scripts/run-cron.cjs (see Dockerfile) and run with
// `node scripts/run-cron.cjs` inside the already-running app container.
runDailyNotifications()
  .then((result) => {
    console.log(`[cron] daily notifications sent for ${result.households} household(s)`)
    process.exit(0)
  })
  .catch((error) => {
    console.error('[cron] daily notifications failed', error)
    process.exit(1)
  })
