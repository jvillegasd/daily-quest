export type Role = 'ADMIN' | 'MEMBER'
export type TaskType = 'ONE_OFF' | 'RECURRING'
export type TaskStatus = 'PENDING' | 'DONE' | 'SKIPPED'
export type PointsType = 'PERSONAL' | 'SHARED'
export type RewardType = 'VIRTUAL' | 'PLEDGE'
export type NotificationEvent =
  | 'TASK_PENDING'
  | 'TASK_COMPLETED_BY_PARTNER'
  | 'REWARD_CLAIMED'
  | 'TASK_ASSIGNED'
  | 'POINTS_MILESTONE'
  | 'DAILY_SUMMARY'

export const ROLE = { ADMIN: 'ADMIN', MEMBER: 'MEMBER' } as const satisfies Record<string, Role>
export const TASK_TYPE = { ONE_OFF: 'ONE_OFF', RECURRING: 'RECURRING' } as const satisfies Record<string, TaskType>
export const TASK_STATUS = { PENDING: 'PENDING', DONE: 'DONE', SKIPPED: 'SKIPPED' } as const satisfies Record<string, TaskStatus>
export const POINTS_TYPE = { PERSONAL: 'PERSONAL', SHARED: 'SHARED' } as const satisfies Record<string, PointsType>
export const REWARD_TYPE = { VIRTUAL: 'VIRTUAL', PLEDGE: 'PLEDGE' } as const satisfies Record<string, RewardType>

export const TASK_FILTER = { ALL: 'all', MINE: 'mine', OPEN: 'open', DONE: 'done' } as const
export type TaskFilter = typeof TASK_FILTER[keyof typeof TASK_FILTER]

export const TASK_ACTION = { COMPLETE: 'complete', SKIP: 'skip' } as const

export const LEVEL = { MAX: 50, XP_MULTIPLIER: 100 } as const

export interface Household {
  id: string
  name: string
  inviteCode: string
  sharedPoints: number
  createdAt: Date
}

export interface Profile {
  id: string
  userId: string
  householdId: string | null
  email: string
  displayName: string
  avatarUrl: string | null
  personalPoints: number
  level: number
  role: Role
  locale: string
  createdAt: Date
}

export interface Category {
  id: string
  householdId: string
  name: string
  icon: string
  color: string
  defaultPoints: number
  isDefault: boolean
  taskCount?: number
}

export interface Task {
  id: string
  householdId: string
  categoryId: string
  createdById: string
  assignedToId: string | null
  completedById: string | null
  title: string
  description: string | null
  points: number
  pointsType: PointsType
  type: TaskType
  recurrenceRule: string | null
  dueAt: Date | null
  completedAt: Date | null
  status: TaskStatus
  createdAt: Date
  category?: Category
  assignedTo?: Profile | null
  completedBy?: Profile | null
  createdBy?: Profile
}

export interface Reward {
  id: string
  householdId: string
  createdById: string
  title: string
  description: string | null
  icon: string
  type: RewardType
  cost: number
  costType: PointsType
  repeatable: boolean
  cooldownHours: number
  timesClaimed: number
  createdAt: Date
  lastClaimedAt?: Date | null
}

export interface RewardClaim {
  id: string
  rewardId: string
  claimedById: string
  claimedAt: Date
}

export interface NotificationPreference {
  id: string
  profileId: string
  eventType: NotificationEvent
  enabled: boolean
  dailyDigestTime: string
  reminderHoursBefore: number
}

export interface Notification {
  id: string
  profileId: string
  type: NotificationEvent
  title: string
  body: string
  linkUrl: string | null
  readAt: Date | null
  createdAt: Date
}

export interface CreateNotificationInput {
  profileId: string
  type: NotificationEvent
  title: string
  body: string
  linkUrl?: string | null
}

export interface CreateTaskInput {
  householdId: string
  categoryId: string
  createdById: string
  assignedToId?: string | null
  title: string
  description?: string | null
  points: number
  pointsType: PointsType
  type: TaskType
  recurrenceRule?: string | null
  dueAt?: Date | null
}

export interface CreateRewardInput {
  householdId: string
  createdById: string
  title: string
  description?: string | null
  icon?: string
  type: RewardType
  cost: number
  costType: PointsType
  repeatable?: boolean
  cooldownHours?: number
}

export const LEVEL_NAMES: Record<number, string> = {
  1: 'Novice',
  2: 'Apprentice',
  3: 'Squire',
  4: 'Scout',
  5: 'Soldier',
  10: 'Knight',
  15: 'Ranger',
  20: 'Champion',
  25: 'Paladin',
  30: 'Warlord',
  35: 'Guardian',
  40: 'Archmage',
  45: 'Overlord',
  50: 'Legendary Hero',
}

export function getLevelName(level: number): string {
  const keys = Object.keys(LEVEL_NAMES).map(Number).sort((a, b) => b - a)
  for (const key of keys) {
    if (level >= key) return LEVEL_NAMES[key]
  }
  return 'Novice'
}

const LEVEL_KEYS: Record<number, string> = {
  1: 'levels.novice',
  2: 'levels.apprentice',
  3: 'levels.squire',
  4: 'levels.scout',
  5: 'levels.soldier',
  10: 'levels.knight',
  15: 'levels.ranger',
  20: 'levels.champion',
  25: 'levels.paladin',
  30: 'levels.warlord',
  35: 'levels.guardian',
  40: 'levels.archmage',
  45: 'levels.overlord',
  50: 'levels.legendaryHero',
}

export function getLevelKey(level: number): string {
  const keys = Object.keys(LEVEL_KEYS).map(Number).sort((a, b) => b - a)
  for (const key of keys) {
    if (level >= key) return LEVEL_KEYS[key]
  }
  return 'levels.novice'
}

export const FORM_DEFAULTS: {
  TASK: { points: number; pointsType: PointsType; type: TaskType }
  REWARD: { icon: string; type: RewardType; cost: number; costType: PointsType; repeatable: boolean; cooldownHours: number }
  CATEGORY: { icon: string; color: string; defaultPoints: number }
} = {
  TASK: { points: 10, pointsType: POINTS_TYPE.PERSONAL, type: TASK_TYPE.ONE_OFF },
  REWARD: { icon: '🏆', type: REWARD_TYPE.PLEDGE, cost: 100, costType: POINTS_TYPE.PERSONAL, repeatable: true, cooldownHours: 24 },
  CATEGORY: { icon: '📌', color: '#c9a84c', defaultPoints: 10 },
}

export function getPointsForLevel(level: number): number {
  return level * level * LEVEL.XP_MULTIPLIER
}

export function getLevelFromPoints(points: number): number {
  let level = 1
  while (getPointsForLevel(level + 1) <= points && level < LEVEL.MAX) level++
  return level
}

export const DEFAULT_CATEGORIES = [
  { name: 'Chores', icon: '🧹', color: '#e67e22', defaultPoints: 15 },
  { name: 'Health', icon: '❤️', color: '#e74c3c', defaultPoints: 20 },
  { name: 'Work', icon: '💼', color: '#3498db', defaultPoints: 25 },
  { name: 'Kids', icon: '🧒', color: '#9b59b6', defaultPoints: 20 },
  { name: 'Finance', icon: '💰', color: '#2ecc71', defaultPoints: 30 },
  { name: 'Self-care', icon: '✨', color: '#1abc9c', defaultPoints: 15 },
  { name: 'Errands', icon: '🛒', color: '#f39c12', defaultPoints: 10 },
]
