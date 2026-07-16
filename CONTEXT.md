# Daily Quest

Daily Quest turns household chores into shared, game-like work.

## Language

**Quest**:
An actionable household chore that can earn points when completed.
_Avoid_: Mission in English product copy; Task outside implementation code

**Quest Occurrence**:
One actionable instance of a Quest, with its own pending, completed, or skipped state.
_Avoid_: Run, copy

**Recurring Quest**:
A chain of Quest Occurrences where completing one occurrence schedules one successor.
_Avoid_: Repeating Task, cron job

**Recurrence Schedule**:
The household-local pattern that determines when a Recurring Quest's scheduled successor becomes available.
_Avoid_: Cron expression in product copy

**Household Timezone**:
The timezone shared by a household for interpreting every Recurrence Schedule.
_Avoid_: User timezone, server timezone
