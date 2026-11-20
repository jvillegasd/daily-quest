export const ROUTES = {
  LOGIN: '/login',
  SIGNUP: '/signup',
  SIGNUP_HOUSEHOLD: '/signup?step=household',
  DASHBOARD: '/dashboard',
  QUESTS: '/quests',
  REWARDS: '/rewards',
  INVITE: '/invite',
  SETTINGS: '/settings',
}

/** `?error=` values the Google sign-in callback redirects with. */
export const AUTH_ERROR = {
  UNVERIFIED_EMAIL: 'unverified-email',
  LINK_REQUIRED: 'link-required',
  LINK_MISMATCH: 'link-mismatch',
} as const
