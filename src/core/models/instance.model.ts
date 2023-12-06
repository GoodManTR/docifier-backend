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
  queryStringParams: z.any().optional(),
})
export type GetInstanceInput = z.infer<typeof getInstanceInput>

export const getInstanceOutput = z.object({
  statusCode: z.number(),
  headers: z.record(z.any()).optional(),
  body: z.any().optional(),
  info: z
    .object({
      isNewInstance: z.boolean(),
      instanceId: z.string(),
    })
    .optional(),
})

export type GetInstanceOutput = z.infer<typeof getInstanceOutput>
