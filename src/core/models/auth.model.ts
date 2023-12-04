import { z } from 'zod'

export const generateCustomTokenInput = z.object({
  userId: z.string(),
  identity: z.string(),
  claims: z.record(z.any()).optional()
})

export type GenerateCustomTokenInput = z.infer<typeof generateCustomTokenInput>