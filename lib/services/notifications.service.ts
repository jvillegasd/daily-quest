import { db } from '@/lib/db/implementation'
import type { Task, Reward } from '@/lib/types'
import type { Locale } from '@/lib/i18n/locale-context'
import { serverT } from '@/lib/i18n/server'
import { NOTIFICATION_KEY, NOTIFICATION_ICON, DEFAULT_REMINDER_HOURS } from '@/lib/constants'

async function sendPush(subscriptions: { endpoint: string; keysJson: string; locale: string }[], buildPayload: (locale: Locale) => object) {
  if (typeof window !== 'undefined') return // client side guard

  try {
    const webpush = await import('web-push')
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT!,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    )
    await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: JSON.parse(sub.keysJson) },
          JSON.stringify(buildPayload(sub.locale as Locale))
        )
      )
    )
  } catch {}
}

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

export const notificationsService = {
  async sendTaskCompleted(task: Task, completedById: string) {
    if (!task.householdId) return
    const subs = await db.notifications.getHouseholdPushSubscriptions(task.householdId)
    const others = subs.filter((s) => s.profileId !== completedById)
    await sendPush(others, (locale) => ({
      title: serverT(locale, NOTIFICATION_KEY.QUEST_COMPLETE),
      body: `A party member completed: "${task.title}" (+${task.points} pts)`,
      icon: NOTIFICATION_ICON,
    }))
  },

  async sendTaskAssigned(task: Task) {
    if (!task.assignedToId) return
    const subs = await db.notifications.getPushSubscriptions(task.assignedToId)
    await sendPush(subs, (locale) => ({
      title: serverT(locale, NOTIFICATION_KEY.QUEST_ASSIGNED),
      body: `"${task.title}" has been assigned to you`,
      icon: NOTIFICATION_ICON,
    }))
  },

  async sendRewardClaimed(reward: Reward, claimedById: string, householdId: string) {
    const subs = await db.notifications.getHouseholdPushSubscriptions(householdId)
    const others = subs.filter((s) => s.profileId !== claimedById)
    await sendPush(others, (locale) => ({
      title: serverT(locale, NOTIFICATION_KEY.TREASURE_CLAIMED),
      body: `A party member claimed: "${reward.title}"`,
      icon: NOTIFICATION_ICON,
    }))
  },

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

      const locale = profile.locale as Locale
      const subs = await db.notifications.getPushSubscriptions(profile.id)
      await sendPush(subs, () => ({
        title: serverT(locale, NOTIFICATION_KEY.DAILY_DIGEST),
        body: `${myTasks.length} quest${myTasks.length > 1 ? 's' : ''} await your attention`,
        icon: NOTIFICATION_ICON,
      }))

      await sendEmail(
        profile.email,
        `Daily Quest — ${myTasks.length} pending`,
        `<h2>Your Daily Quests</h2><ul>${myTasks.map((t) => `<li>${t.title} (+${t.points} pts)</li>`).join('')}</ul>`
      )
    }
  },

  async sendPendingReminder(householdId: string, withinHours = DEFAULT_REMINDER_HOURS) {
    const dueSoon = await db.tasks.findPendingDue(householdId, withinHours)
    for (const task of dueSoon) {
      if (!task.assignedToId) continue
      const subs = await db.notifications.getPushSubscriptions(task.assignedToId)
      await sendPush(subs, (locale) => ({
        title: serverT(locale, NOTIFICATION_KEY.QUEST_DUE_SOON),
        body: `"${task.title}" is due in less than ${withinHours}h`,
        icon: NOTIFICATION_ICON,
      }))
    }
  },
}
