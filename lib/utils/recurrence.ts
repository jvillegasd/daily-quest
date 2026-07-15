export type RecurrenceFrequency = 'DAILY' | 'WEEKDAYS' | 'WEEKLY' | 'MONTHLY'

export type RecurrenceSchedule = {
  frequency: RecurrenceFrequency
  time: string
  weekday?: number
  monthDay?: number | 'L'
}

function timeParts(time: string): [number, number] {
  const match = /^(\d{2}):(\d{2})$/.exec(time)
  if (!match) throw new Error('Invalid recurrence time')
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (hour > 23 || minute > 59) throw new Error('Invalid recurrence time')
  return [hour, minute]
}

export function buildRecurrenceRule(schedule: RecurrenceSchedule): string {
  const [hour, minute] = timeParts(schedule.time)
  if (schedule.frequency === 'DAILY') return `${minute} ${hour} * * *`
  if (schedule.frequency === 'WEEKDAYS') return `${minute} ${hour} * * 1-5`
  if (schedule.frequency === 'WEEKLY' && schedule.weekday !== undefined && schedule.weekday >= 0 && schedule.weekday <= 6) {
    return `${minute} ${hour} * * ${schedule.weekday}`
  }
  if (schedule.frequency === 'MONTHLY' && (schedule.monthDay === 'L' || (typeof schedule.monthDay === 'number' && schedule.monthDay >= 1 && schedule.monthDay <= 28))) {
    return `${minute} ${hour} ${schedule.monthDay} * *`
  }
  throw new Error('Incomplete recurrence schedule')
}

export function parseSupportedRecurrenceRule(rule: string): RecurrenceSchedule | null {
  const [minuteText, hourText, day, month, weekday, ...extra] = rule.trim().split(/\s+/)
  if (extra.length || month !== '*' || !/^\d+$/.test(minuteText) || !/^\d+$/.test(hourText)) return null
  const minute = Number(minuteText)
  const hour = Number(hourText)
  if (minute > 59 || hour > 23) return null
  const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`

  if (day === '*' && weekday === '*') return { frequency: 'DAILY', time }
  if (day === '*' && weekday === '1-5') return { frequency: 'WEEKDAYS', time }
  if (day === '*' && /^[0-6]$/.test(weekday)) return { frequency: 'WEEKLY', time, weekday: Number(weekday) }
  if (weekday === '*' && (day === 'L' || (/^\d+$/.test(day) && Number(day) >= 1 && Number(day) <= 28))) {
    return { frequency: 'MONTHLY', time, monthDay: day === 'L' ? 'L' : Number(day) }
  }
  return null
}

export function isValidTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat('en', { timeZone: timezone }).format()
    return true
  } catch {
    return false
  }
}
