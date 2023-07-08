import { z } from "zod"
import { userTypes } from "./types"

export const context = z.object({
    path: z.string(),
    methodName: z.string(),
    identity: z.string(),
    userId: z.string(),
    userIP: z.string(),
    queryStringParameters: z.record(z.string()),
    headers: z.record(z.string()),
    httpMethod: z.string(),
    body: z.record(z.string()),
    sourceIp: z.string(),
    claims: z.any(),
})

export type Context = z.infer<typeof context>

export const tokenMetaData = z.object({
    userType: userTypes,
    userId: z.string(),
})
export type TokenMetaData = z.infer<typeof tokenMetaData>