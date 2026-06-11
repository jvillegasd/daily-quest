import { describe, it, expect } from 'vitest'
import { useTestDb } from '../helpers/db'
import { createUser, createHousehold, createProfile } from '@/tests/factories'

describe('ProfileRepository', () => {
  const db = useTestDb()

  it('creates a profile and finds it by userId', async () => {
    const user = await createUser()
    const profile = await createProfile(user.id)

    const found = await db.profiles.findByUserId(user.id)
    expect(found).not.toBeNull()
    expect(found!.email).toBe(user.email)
  })

  it('findByHousehold returns all members', async () => {
    const household = await createHousehold()
    const u1 = await createUser()
    const u2 = await createUser()
    await createProfile(u1.id, household.id)
    await createProfile(u2.id, household.id)

    const members = await db.profiles.findByHousehold(household.id)
    expect(members).toHaveLength(2)
  })

  it('joinHousehold links profile to household', async () => {
    const user = await createUser()
    const household = await createHousehold()
    const profile = await createProfile(user.id)
    expect(profile.householdId).toBeNull()

    await db.profiles.joinHousehold(profile.id, household.id)
    const updated = await db.profiles.findById(profile.id)
    expect(updated!.householdId).toBe(household.id)
  })

  it('addPersonalPoints auto-levels up when threshold is crossed', async () => {
    const user = await createUser()
    const profile = await createProfile(user.id, undefined, { personalPoints: 399 })

    // Adding 1 point crosses the 400-point threshold → level 2
    const updated = await db.profiles.addPersonalPoints(profile.id, 1)
    expect(updated.personalPoints).toBe(400)
    expect(updated.level).toBe(2)
  })

  it('addPersonalPoints does not level up when threshold not crossed', async () => {
    const user = await createUser()
    const profile = await createProfile(user.id, undefined, { personalPoints: 0, level: 1 })

    const updated = await db.profiles.addPersonalPoints(profile.id, 50)
    expect(updated.level).toBe(1)
  })

  it('deductPersonalPoints reduces points', async () => {
    const user = await createUser()
    const profile = await createProfile(user.id, undefined, { personalPoints: 200 })

    await db.profiles.deductPersonalPoints(profile.id, 50)
    const updated = await db.profiles.findById(profile.id)
    expect(updated!.personalPoints).toBe(150)
  })
})
