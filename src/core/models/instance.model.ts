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
  referenceKey: z.object({
    name: z.string(),
    value: z.string(),
  }).optional(),
  context: z.any(),
  body: z.any().optional(),
  queryStringParams: z.any().optional(),
})
export type GetInstanceInput = z.infer<typeof getInstanceInput>

export const deleteInstanceInput = z.object({
  classId: z.string(),
  instanceId: z.string(),
})
export type DeleteInstanceInput = z.infer<typeof deleteInstanceInput>


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

export const getReferenceKeyInput = z.object({
  classId: z.string(),
  key: z.object({
    name: z.string(),
    value: z.string(),
  }),
})
export type GetReferenceKeyInput = z.infer<typeof getReferenceKeyInput>

export const getReferenceKeyOutput = z.object({
  success: z.boolean(),
  instanceId: z.string().optional(),
})
export type GetReferenceKeyOutput = z.infer<typeof getReferenceKeyOutput>

export const setReferenceKeyInput = z.object({
  classId: z.string(),
  instanceId: z.string(),
  key: z.object({
    name: z.string(),
    value: z.string(),
  }),
})
export type SetReferenceKeyInput = z.infer<typeof setReferenceKeyInput>

export const setReferenceKeyOutput = z.object({
  success: z.boolean(),
})
export type SetReferenceKeyOutput = z.infer<typeof setReferenceKeyOutput>

export const deleteReferenceKeyInput = z.object({
  classId: z.string(),
  key: z.object({
    name: z.string(),
    value: z.string(),
  }),
})
export type DeleteReferenceKeyInput = z.infer<typeof deleteReferenceKeyInput>

export const deleteReferenceKeyOutput = z.object({
  success: z.boolean(),
})
export type DeleteReferenceKeyOutput = z.infer<typeof deleteReferenceKeyOutput>