import type {
  Household,
  Profile,
  Category,
  Task,
  Reward,
  RewardClaim,
  NotificationPreference,
  Notification,
  CreateNotificationInput,
  CreateTaskInput,
  CreateRewardInput,
} from '@/lib/types'

export interface HouseholdRepository {
  findById(id: string): Promise<Household | null>
  findByInviteCode(code: string): Promise<Household | null>
  create(name: string): Promise<Household>
  addSharedPoints(id: string, points: number): Promise<Household>
  deductSharedPoints(id: string, points: number): Promise<Household>
}

export interface ProfileRepository {
  findById(id: string): Promise<Profile | null>
  findByUserId(userId: string): Promise<Profile | null>
  findByHousehold(householdId: string): Promise<Profile[]>
  create(data: {
    userId: string
    email: string
    displayName: string
    avatarUrl?: string | null
  }): Promise<Profile>
  joinHousehold(profileId: string, householdId: string): Promise<Profile>
  addPersonalPoints(profileId: string, points: number): Promise<Profile>
  deductPersonalPoints(profileId: string, points: number): Promise<Profile>
  update(profileId: string, data: Partial<Pick<Profile, 'displayName' | 'avatarUrl' | 'locale'>>): Promise<Profile>
}

export interface CategoryRepository {
  findById(id: string): Promise<Category | null>
  findByHousehold(householdId: string): Promise<Category[]>
  create(data: Omit<Category, 'id'>): Promise<Category>
  update(id: string, data: Partial<Omit<Category, 'id' | 'householdId'>>): Promise<Category>
  delete(id: string): Promise<void>
  seedDefaults(householdId: string): Promise<Category[]>
}

export interface TaskRepository {
  findByHousehold(householdId: string): Promise<Task[]>
  findById(id: string): Promise<Task | null>
  create(data: CreateTaskInput): Promise<Task>
  update(id: string, data: Partial<CreateTaskInput>): Promise<Task>
  complete(taskId: string, userId: string): Promise<Task>
  skip(taskId: string): Promise<Task>
  delete(id: string): Promise<void>
  findPendingDue(householdId: string, withinHours: number): Promise<Task[]>
}

export interface RewardRepository {
  findByHousehold(householdId: string): Promise<Reward[]>
  findById(id: string): Promise<Reward | null>
  create(data: CreateRewardInput): Promise<Reward>
  update(id: string, data: Partial<CreateRewardInput>): Promise<Reward>
  delete(id: string): Promise<void>
  claim(rewardId: string, claimedById: string): Promise<RewardClaim>
  getLastClaim(rewardId: string, userId: string): Promise<RewardClaim | null>
}

export interface NotificationRepository {
  // Per-event preferences (Settings toggles)
  findByProfile(profileId: string): Promise<NotificationPreference[]>
  upsert(data: Omit<NotificationPreference, 'id'>): Promise<NotificationPreference>
  // In-app notification inbox
  create(data: CreateNotificationInput): Promise<Notification>
  createMany(items: CreateNotificationInput[]): Promise<void>
  list(profileId: string, limit: number): Promise<Notification[]>
  countUnread(profileId: string): Promise<number>
  markRead(profileId: string, ids?: string[]): Promise<void>
}

export interface Database {
  households: HouseholdRepository
  profiles: ProfileRepository
  categories: CategoryRepository
  tasks: TaskRepository
  rewards: RewardRepository
  notifications: NotificationRepository
}
