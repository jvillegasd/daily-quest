export const API = {
  TASKS: '/api/tasks',
  TASK: (id: string) => `/api/tasks/${id}`,
  REWARDS: '/api/rewards',
  REWARD_CLAIM: (id: string) => `/api/rewards/${id}/claim`,
  CATEGORIES: '/api/categories',
  CATEGORY: (id: string) => `/api/categories/${id}`,
  INVITE: '/api/invite',
  NOTIFICATIONS_SUBSCRIBE: '/api/notifications/subscribe',
  NOTIFICATIONS_PREFERENCES: '/api/notifications/preferences',
  PROFILE: '/api/profile',
}
