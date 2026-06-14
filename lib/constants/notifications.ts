export const NOTIFICATION_KEY = {
  QUEST_COMPLETE:   'notifications.push.questComplete',
  QUEST_ASSIGNED:   'notifications.push.questAssigned',
  TREASURE_CLAIMED: 'notifications.push.treasureClaimed',
  DAILY_DIGEST:     'notifications.push.dailyDigest',
  QUEST_DUE_SOON:   'notifications.push.questDueSoon',
} as const

export const NOTIFICATION_ICON = '/icons/icon-192.png'
export const DEFAULT_REMINDER_HOURS = 1

// How many notifications the bell dropdown fetches per request.
export const NOTIFICATION_FEED_LIMIT = 30
