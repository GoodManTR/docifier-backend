import { z } from "zod"
import { userTypes } from "./types"

export const context = z.object({
    classId: z.string(),
    methodName: z.string(),
    instanceId: z.string().optional(),
    identity: z.string(),
    userId: z.string(),
    userIP: z.string(),
    sourceIp: z.string(),
    claims: z.any(),
})

export type Context = z.infer<typeof context>

export const tokenMetaData = z.object({
    userType: userTypes,
    userId: z.string(),
})
export type TokenMetaData = z.infer<typeof tokenMetaData>