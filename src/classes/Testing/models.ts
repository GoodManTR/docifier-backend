import { z } from 'zod'
import { userTypes } from '../../types'

export const upsertProfileInput = z.object({
  email: z.string().optional(),
  name: z.string().optional(),
  surname: z.string().optional(),
})

export type UpsertProfileInput = z.infer<typeof upsertProfileInput>

export const registerInput = z.object({
  name: z.string(),
  surname: z.string(),
  email: z.string().email(),
  password: z.string(),
  confirmPassword: z.string(),
  userType: userTypes,
})

export const signInInput = z.object({
  email: z.string().email(),
  password: z.string(),
})

export const changePasswordInput = z.object({
  oldPassword: z.string(),
  newPassword: z.string(),
  newPasswordConfirm: z.string(),
})
