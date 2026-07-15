import { CronExpressionParser } from 'cron-parser'

export function isValidRecurrenceRule(rule: string): boolean {
  if (!rule.trim()) return false
  try {
    CronExpressionParser.parse(rule)
    return true
  } catch {
    return false
  }
}

export function nextRecurrenceAt(rule: string, after: Date, timezone: string): Date {
  return CronExpressionParser.parse(rule, { currentDate: after, tz: timezone }).next().toDate()
}
