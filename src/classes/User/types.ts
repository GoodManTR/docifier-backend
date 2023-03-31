import { z } from "zod"

export const methods = z.enum([
    'getProfile',
    'upsertProfile',
])

export const userData = z.object({
    userId: z.string(),
    email: z.string(),
    name: z.string(),
    surname: z.string(),
})

export type UserData = z.infer<typeof userData>