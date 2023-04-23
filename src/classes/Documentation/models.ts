import { z } from 'zod'

export const documentationConfig = z.object({
    docId: z.string().optional(),
    alias: z.string(),
    users: z.array(z.object({
        userId: z.string(),
        role: z.string(),
    })),
})

export type DocumentationConfig = z.infer<typeof documentationConfig>

export const addUserInput = z.object({
    userId: z.string(),
    docId: z.string(),
})

export type AddUserInput = z.infer<typeof addUserInput>