import { z } from 'zod'
import {
  POINTS_TYPE,
  TASK_TYPE,
  TASK_STATUS,
  TASK_ACTION,
  REWARD_TYPE,
} from '@/lib/types'
import { SUPPORTED_LOCALES } from '@/lib/i18n/locales'

/**
 * Shared validation bounds. Kept as named constants (no magic numbers) and
 * sized generously — the goal is to reject abuse (oversized payloads, wrong
 * types, mass-assignment), not to enforce product rules.
 */
const LIMITS = {
  NAME_MAX: 80,
  TITLE_MAX: 200,
  TEXT_MAX: 1000,
  RULE_MAX: 200,
  ICON_MAX: 16,
  URL_MAX: 2000,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 128,
  POINTS_MAX: 1_000_000,
  COOLDOWN_HOURS_MAX: 8760,
  IDS_MAX: 200,
} as const

// IDs are Prisma cuid()s; ownership is enforced separately via authorize(), so
// here we only require a non-empty string rather than a strict cuid format
// (which would risk rejecting valid ids across cuid generator versions).
const id = z.string().min(1)

const pointsType = z.enum([POINTS_TYPE.PERSONAL, POINTS_TYPE.SHARED])
const points = z.number().int().min(0).max(LIMITS.POINTS_MAX)
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/)
const icon = z.string().min(1).max(LIMITS.ICON_MAX)
const title = z.string().trim().min(1).max(LIMITS.TITLE_MAX)
const description = z.string().max(LIMITS.TEXT_MAX).nullish()

// ---- Auth ----

export const RegisterSchema = z.object({
  email: z.email().max(LIMITS.URL_MAX),
  password: z.string().min(LIMITS.PASSWORD_MIN).max(LIMITS.PASSWORD_MAX),
  name: z.string().trim().min(1).max(LIMITS.NAME_MAX),
})

// ---- Profile ----

export const ProfilePatchSchema = z.object({
  displayName: z.string().trim().min(1).max(LIMITS.NAME_MAX).optional(),
  avatarUrl: z.url().max(LIMITS.URL_MAX).optional(),
  locale: z.enum([...SUPPORTED_LOCALES]).optional(),
})

// ---- Households / Invites ----

export const HouseholdCreateSchema = z.object({
  name: z.string().trim().min(1).max(LIMITS.NAME_MAX),
})

export const InviteSchema = z.object({
  email: z.email().max(LIMITS.URL_MAX),
})

export const InviteAcceptSchema = z.object({
  token: z.string().min(1),
})

// ---- Tasks ----

export const TaskCreateSchema = z.object({
  categoryId: id,
  title,
  description,
  points,
  pointsType,
  type: z.enum([TASK_TYPE.ONE_OFF, TASK_TYPE.RECURRING]),
  recurrenceRule: z.string().max(LIMITS.RULE_MAX).nullish(),
  dueAt: z.iso.datetime().nullish(),
  assignedToId: id.nullish(),
})

export const TaskPatchSchema = z.object({
  action: z.enum([TASK_ACTION.COMPLETE, TASK_ACTION.SKIP]).optional(),
  categoryId: id.optional(),
  title: title.optional(),
  description,
  points: points.optional(),
  pointsType: pointsType.optional(),
  type: z.enum([TASK_TYPE.ONE_OFF, TASK_TYPE.RECURRING]).optional(),
  recurrenceRule: z.string().max(LIMITS.RULE_MAX).nullish(),
  dueAt: z.iso.datetime().nullish(),
  assignedToId: id.nullish(),
  status: z.enum([TASK_STATUS.PENDING, TASK_STATUS.DONE, TASK_STATUS.SKIPPED]).optional(),
})

// ---- Rewards ----

export const RewardCreateSchema = z.object({
  title,
  description,
  icon: icon.optional(),
  type: z.enum([REWARD_TYPE.VIRTUAL, REWARD_TYPE.PLEDGE]),
  cost: points,
  costType: pointsType,
  repeatable: z.boolean().optional(),
  cooldownHours: z.number().int().min(0).max(LIMITS.COOLDOWN_HOURS_MAX).optional(),
})

export const RewardPatchSchema = z.object({
  title: title.optional(),
  description,
  icon: icon.optional(),
  type: z.enum([REWARD_TYPE.VIRTUAL, REWARD_TYPE.PLEDGE]).optional(),
  cost: points.optional(),
  costType: pointsType.optional(),
  repeatable: z.boolean().optional(),
  cooldownHours: z.number().int().min(0).max(LIMITS.COOLDOWN_HOURS_MAX).optional(),
})

// ---- Categories ----

export const CategoryCreateSchema = z.object({
  name: z.string().trim().min(1).max(LIMITS.NAME_MAX),
  icon,
  color: hexColor,
  defaultPoints: points,
})

export const CategoryPatchSchema = z.object({
  name: z.string().trim().min(1).max(LIMITS.NAME_MAX).optional(),
  icon: icon.optional(),
  color: hexColor.optional(),
  defaultPoints: points.optional(),
})

// ---- Notifications ----

// Mark in-app notifications read. Omitting `ids` marks all of the caller's
// unread notifications as read.
export const NotificationReadSchema = z.object({
  ids: z.array(id).max(LIMITS.IDS_MAX).optional(),
})

/**
 * Parse a request body against a schema. Returns either the typed data or a
 * uniform 422 response, so route handlers stay a couple of lines.
 */
export type ParseResult<T> = { ok: true; data: T } | { ok: false; response: Response }

export async function parseBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<ParseResult<T>> {
  const raw = await request.json().catch(() => null)
  const result = schema.safeParse(raw)
  if (!result.success) {
    return {
      ok: false,
      response: Response.json(
        { error: 'Invalid request', details: z.flattenError(result.error) },
        { status: 400 },
      ),
    }
  }
  return { ok: true, data: result.data }
}
