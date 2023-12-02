import * as z from 'zod'

export const writeToDatabaseOperation = z.object({
      partKey: z.string(),
      sortKey: z.string(),
      data: z.record(z.any()),
      expireAt: z.number().int().optional(),
})
export type WriteToDatabaseOperation = z.infer<typeof writeToDatabaseOperation>

export const readDatabaseOperation = z.object({
      partKey: z.string(),
      sortKey: z.string(),
})
export type ReadDatabaseOperation = z.infer<typeof readDatabaseOperation>

export const removeFromDatabaseOperation = z.object({
      partKey: z.string(),
      sortKey: z.string(),
})
export type RemoveFromDatabaseOperation = z.infer<typeof removeFromDatabaseOperation>

export const queryDatabaseOperation = z.object({
      partKey: z.string(),
      beginsWith: z.string().min(1).optional(),
      greaterOrEqual: z.string().min(1).optional(),
      lessOrEqual: z.string().min(1).optional(),
      reverse: z.boolean().default(false),
      nextToken: z.string().optional(),
      limit: z.number().min(1).optional(),
  })
  export type QueryDatabaseOperation = z.infer<typeof queryDatabaseOperation>