import { db } from '@/lib/db/implementation'
import type { Task, Reward, NotificationEvent, CreateNotificationInput } from '@/lib/types'
import type { Locale } from '@/lib/i18n/locale-context'
import { serverT } from '@/lib/i18n/server'
import { escapeHtml } from '@/lib/security/escape'
import { NOTIFICATION_KEY, DEFAULT_REMINDER_HOURS, ROUTES } from '@/lib/constants'

// Email (digest + reminders) via Resend. No-ops if RESEND_* env vars are unset.
async function sendEmail(to: string, subject: string, html: string) {
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to,
      subject,
      html,
    })
  } catch {}
}

// Respect the recipient's per-event preference (Settings toggles). Defaults to
// enabled when the profile has no stored row for that event.
async function isEnabled(profileId: string, eventType: NotificationEvent): Promise<boolean> {
  const prefs = await db.notifications.findByProfile(profileId)
  return prefs.find((p) => p.eventType === eventType)?.enabled ?? true
}

export const notificationsService = {
  // Instant events → in-app notification inbox. Titles are localized to the
  // recipient; bodies are stored as data and rendered (escaped) by React.
  async sendTaskAssigned(task: Task) {
    if (!task.assignedToId) return
    if (!(await isEnabled(task.assignedToId, 'TASK_ASSIGNED'))) return
    const profile = await db.profiles.findById(task.assignedToId)
    if (!profile) return
    await db.notifications.create({
      profileId: profile.id,
      type: 'TASK_ASSIGNED',
      title: serverT(profile.locale as Locale, NOTIFICATION_KEY.QUEST_ASSIGNED),
      body: `"${task.title}" has been assigned to you`,
      linkUrl: ROUTES.QUESTS,
    })
  },

  async sendTaskCompleted(task: Task, completedById: string) {
    if (!task.householdId) return
    const members = await db.profiles.findByHousehold(task.householdId)
    const items: CreateNotificationInput[] = []
    for (const p of members) {
      if (p.id === completedById) continue
      if (!(await isEnabled(p.id, 'TASK_COMPLETED_BY_PARTNER'))) continue
      items.push({
        profileId: p.id,
        type: 'TASK_COMPLETED_BY_PARTNER',
        title: serverT(p.locale as Locale, NOTIFICATION_KEY.QUEST_COMPLETE),
        body: `A party member completed "${task.title}" (+${task.points} pts)`,
        linkUrl: ROUTES.QUESTS,
      })
    }
    await db.notifications.createMany(items)
  },

  async sendRewardClaimed(reward: Reward, claimedById: string, householdId: string) {
    const members = await db.profiles.findByHousehold(householdId)
    const items: CreateNotificationInput[] = []
    for (const p of members) {
      if (p.id === claimedById) continue
      if (!(await isEnabled(p.id, 'REWARD_CLAIMED'))) continue
      items.push({
        profileId: p.id,
        type: 'REWARD_CLAIMED',
        title: serverT(p.locale as Locale, NOTIFICATION_KEY.TREASURE_CLAIMED),
        body: `A party member claimed "${reward.title}"`,
        linkUrl: ROUTES.REWARDS,
      })
    }
    await db.notifications.createMany(items)
  },

  // Scheduled summaries → email (cron job). User-controlled task titles are
  // HTML-escaped before interpolation into the email body.
  async sendDailyDigest(householdId: string) {
    const tasks = await db.tasks.findByHousehold(householdId)
    const pending = tasks.filter((t) => t.status === 'PENDING')
    if (pending.length === 0) return

    const profiles = await db.profiles.findByHousehold(householdId)
    for (const profile of profiles) {
      const myTasks = pending.filter(
        (t) => t.assignedToId === profile.id || t.assignedToId === null
      )
      if (myTasks.length === 0) continue
      if (!(await isEnabled(profile.id, 'DAILY_SUMMARY'))) continue

      const items = myTasks
        .map((t) => `<li>${escapeHtml(t.title)} (+${t.points} pts)</li>`)
        .join('')
      await sendEmail(
        profile.email,
        `Daily Quest — ${myTasks.length} pending`,
        `<h2>Your Daily Quests</h2><ul>${items}</ul>`
      )
    }
  },

  async sendPendingReminder(householdId: string, withinHours = DEFAULT_REMINDER_HOURS) {
    const dueSoon = await db.tasks.findPendingDue(householdId, withinHours)
    for (const task of dueSoon) {
      if (!task.assignedToId) continue
      if (!(await isEnabled(task.assignedToId, 'TASK_PENDING'))) continue
      const profile = await db.profiles.findById(task.assignedToId)
      if (!profile) continue
      await sendEmail(
        profile.email,
        'Daily Quest — reminder',
        `<p>"${escapeHtml(task.title)}" is due in less than ${withinHours}h.</p>`
      )
    }
  },
}
