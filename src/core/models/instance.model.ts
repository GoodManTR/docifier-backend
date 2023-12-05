import { z } from 'zod'

export const getInstanceOperation = z.object({
      partKey: z.string(),
      sortKey: z.string(),
      data: z.record(z.any()),
      expireAt: z.number().int().optional(),
})
export type GetInstanceOperation = z.infer<typeof getInstanceOperation>

export const getInstanceInput = z.object({
      classId: z.string(),
      instanceId: z.string().optional(),
      body: z.any().optional(),
})
export type GetInstanceInput = z.infer<typeof getInstanceInput>