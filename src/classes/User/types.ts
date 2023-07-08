import { z } from "zod"

export const methods = z.enum([
    'getProfile',
    'upsertProfile',
    'signIn',
    'signUp',
    'changePassword',
])

export const allowedMethods = z.enum([
    'signIn',
    'signUp',
])

export const userAllowedMethods = z.enum([
    'changePassword',
])

export const userData = z.object({
    userId: z.string(),
    email: z.string(),
    name: z.string(),
    surname: z.string(),
})

export type UserData = z.infer<typeof userData>