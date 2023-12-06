import { z } from 'zod'

export const registerInput = z.object({
      email: z.string().email(),
      password: z.string(),
      confirmPassword: z.string(),
})

export type RegisterInput = z.infer<typeof registerInput>

export const loginInput = z.object({
      password: z.string(),
})

export type LoginInput = z.infer<typeof loginInput>