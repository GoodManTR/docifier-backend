import { z } from 'zod'
import { docTreeItem } from './types'

export const documentationConfig = z.object({
    documentationId: z.string().optional(),
    alias: z.string(),
    users: z
        .array(
            z.object({
                userId: z.string(),
                role: z.string(),
            }),
        )
        .optional(),
})
export type DocumentationConfig = z.infer<typeof documentationConfig>

export const createDocumentationInput = z.object({
    alias: z.string(),
})
export type CreateDocumentationInput = z.infer<typeof createDocumentationInput>

export const deleteDocInput = z.object({
    documentationId: z.string(),
})

export type DeleteDocInput = z.infer<typeof deleteDocInput>

export const addUserInput = z.object({
    userId: z.string(),
    documentationId: z.string(),
})

export type AddUserInput = z.infer<typeof addUserInput>

export const saveDocTreeInput = z.object({
    documentationId: z.string(),
    tree: z.array(docTreeItem),
})

export type SaveDocTreeInput = z.infer<typeof saveDocTreeInput>

export const getDocTreeInput = z.object({
    documentationId: z.string(),
})

export type GetDocTreeInput = z.infer<typeof getDocTreeInput>
