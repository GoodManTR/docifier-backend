import { z } from 'zod'

export const createUserInput = z.object({
      email: z.string().email(),
      passwordHash: z.string(),
})

export type CreateUserInput = z.infer<typeof createUserInput>
