import { z } from 'zod'
import { userTypes } from '../../types'

export const methods = z.enum([
    'signUp',
    'signIn',
    'signOut',
    'refreshToken'
])

export const allowedMethods = z.enum([
    'signUp',
    'signIn'
])

export const enduserAllowedMethods = z.enum([
    'signOut',
    'refreshToken'
])

export const user = z.object({
    email: z.string().email(),
    password: z.string(),
    type: userTypes,
    id: z.string(),
})
export type UserMetaData = z.infer<typeof user>

export const tokenMetaData = z.object({
    userType: userTypes,
    userId: z.string(),
    IP: z.string(),
})
export type TokenMetaData = z.infer<typeof tokenMetaData>

export const validateTokenResponse = z.object({
    tokenMetaData,
    error: z.string(),
}).partial()
export type ValidateTokenResponse = z.infer<typeof validateTokenResponse>

export const verifyRes = z.object({
    email: z.string().email(),
    type: userTypes,
    id: z.string(),
    IP: z.string(),
    iat: z.number(),
    exp: z.number(),
    error: z.string(),
})
export type VerifyResponse = z.infer<typeof verifyRes>