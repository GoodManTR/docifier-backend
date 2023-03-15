import { z } from 'zod'
import { userTypes } from '../../types'


export const registerInput = z.object({
  email: z.string().email(),
  password: z.string(),
  userTypes,
})

export const signInInput = z.object({
  email: z.string().email(),
  password: z.string(),
})

export const signOutInput = z.object({
  userId: z.string(),
})
