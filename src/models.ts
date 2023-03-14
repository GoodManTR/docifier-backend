import { z } from "zod"

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
})

export type Context = z.infer<typeof context>