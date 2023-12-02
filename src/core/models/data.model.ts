import { z } from 'zod'
import { state } from './state.model'

export const context = z.object({
  classId: z.string(),
  methodName: z.string(),
  instanceId: z.string().optional(),
  identity: z.string(),
  userId: z.string(),
  userIP: z.string(),
  sourceIp: z.string(),
  claims: z.record(z.any()).optional(),
})

export type Context = z.infer<typeof context>

export const httpMethod = z.enum([
  'get',
  'GET',
  'delete',
  'DELETE',
  'head',
  'HEAD',
  'options',
  'OPTIONS',
  'post',
  'POST',
  'put',
  'PUT',
  'patch',
  'PATCH',
  'purge',
  'PURGE',
  'link',
  'LINK',
  'unlink',
  'UNLINK',
])
export type HttpMethod = z.infer<typeof httpMethod>

export const methodRequest = z.object({
  httpMethod: httpMethod.default('POST'),
  pathParameters: z.any().optional(),
  queryStringParams: z.record(z.any()).default({}),
  headers: z.record(z.any()).default({}),
  body: z.any().optional(),
})
export type MethodRequest = z.infer<typeof methodRequest>

export const methodResponse = z.object({
  statusCode: z.number().min(100).max(599).default(204),
  body: z.any().default({}),
  headers: z.record(z.string()).optional(),
  isBase64Encoded: z.boolean().optional(),
})
export type MethodResponse = z.infer<typeof methodResponse>

export const data = z.object({
  context,
  state,
  request: methodRequest,
  response: methodResponse,
})

export type Data = z.infer<typeof data>
