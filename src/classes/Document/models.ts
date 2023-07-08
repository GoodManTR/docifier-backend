import { z } from 'zod'

export const saveDocSheetInput = z.object({
    documentationId: z.string(),
    documentId: z.string(),
    data: z.string(),
})

export type SaveDocSheetInput = z.infer<typeof saveDocSheetInput>

export const getDocSheetInput = z.object({
    documentationId: z.string(),
    documentId: z.string(),
})

export type GetDocSheetInput = z.infer<typeof getDocSheetInput>
