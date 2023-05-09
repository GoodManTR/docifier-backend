import { z } from 'zod'
import { docTreeItem } from './types'

export const documentationConfig = z.object({
    docId: z.string().optional(),
    alias: z.string(),
    users: z.array(z.object({
        userId: z.string(),
        role: z.string(),
    })).optional(),
})

export type DocumentationConfig = z.infer<typeof documentationConfig>

export const deleteDocInput = z.object({
    docId: z.string()
})

export type DeleteDocInput = z.infer<typeof deleteDocInput>

export const addUserInput = z.object({
    userId: z.string(),
    docId: z.string(),
})

export type AddUserInput = z.infer<typeof addUserInput>

export const saveDocTreeInput = z.object({
    docId: z.string(),
    tree: z.array(docTreeItem)
  })

export type SaveDocTreeInput = z.infer<typeof saveDocTreeInput>

