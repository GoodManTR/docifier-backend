import { z } from "zod"

export const upsertProfileInput = z.object({
    email: z.string().optional(),
    name: z.string().optional(),
    surname: z.string().optional(),
})

export type UpsertProfileInput = z.infer<typeof upsertProfileInput>