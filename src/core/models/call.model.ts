import { z } from 'zod'

export const methodCallInput = z.object({
  classId: z.string(),
  methodName: z.string(),
  instanceId: z.string(),
  context: z.any(),
  body: z.any(),
})

export type MethodCallInput = z.infer<typeof methodCallInput>

export const methodCallOutput = z.object({
  statusCode: z.number(),
  headers: z.record(z.any()).optional(),
  body: z.any().optional(),
})

export type MethodCallOutput = z.infer<typeof methodCallOutput>