import { z } from 'zod'

export const lockInstanceInput = z.object({
  classId: z.string(),
  instanceId: z.string(),
})

export type LockInstanceInput = z.infer<typeof lockInstanceInput>
