import { z } from 'zod'

export const anonymousIdentity = 'anonymous_user'

export const generateCustomTokenInput = z.object({
  userId: z.string(),
  identity: z.string(),
  claims: z.record(z.any()).optional()
})

export type GenerateCustomTokenInput = z.infer<typeof generateCustomTokenInput>

export const authWithCustomTokenInput = z.object({
  customToken: z.string(),
})
export type AuthWithCustomTokenInput = z.infer<typeof authWithCustomTokenInput>

export const firebaseEnvs = z.object({
  iosAppId: z.string(),
  androidAppId: z.string(),
  webAppId: z.string(),
  gcmSenderId: z.string(),
})
export type FirebaseEnvs = z.infer<typeof firebaseEnvs>
export const firebaseResponse = z.object({
  customToken: z.string(),
  projectId: z.string(),
  apiKey: z.string(),
  envs: firebaseEnvs,
})
export type FirebaseResponse = z.infer<typeof firebaseResponse>

export const authResponse = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  firebase: firebaseResponse,
})
export type AuthResponse = z.infer<typeof authResponse>

export const authAPI = z.enum(['auth', 'refresh', 'signOut'])
export type AuthAPI = z.infer<typeof authAPI>

export const authDDBItem = z.object({
  part: z.string(),
  sort: z.string(),
  refreshToken: z.string(),
  expiresAt: z.number(),
})
export type AuthDDBItem = z.infer<typeof authDDBItem>

export const refreshTokenInput = z.object({
  refreshToken: z.string(),
})
export type RefreshTokenInput = z.infer<typeof refreshTokenInput>

export const signOutInput = z.object({
  accessToken: z.string(),
})
export type SignOutInput = z.infer<typeof signOutInput>

export const GenerateCustomTokenOperation = z.object({
  userId: z.string().min(1),
  identity: z.string().min(1),
  claims: z.record(z.any()).default({}),
})
export type GenerateCustomTokenOperation = z.infer<typeof GenerateCustomTokenOperation>

export const AccessTokenPayload = z.object({
  identity: z.string(),
  anonymous: z.boolean(),
  userId: z.string(),
  claims: z.record(z.any()),
  sessionId: z.string(),
})
export type AccessTokenPayload = z.infer<typeof AccessTokenPayload>