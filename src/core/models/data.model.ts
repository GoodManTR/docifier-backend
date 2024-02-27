import { z } from 'zod'

export interface Template {
  authorizer: string
  getState: string
  init: string
  get: string | undefined
  getInstanceId: string
  methods: {
    method: string
    handler: string
    type: 'READ' | 'WRITE'
  }[]
}

export const context = z.object({
  classId: z.string(),
  methodName: z.string(),
  culture: z.string().optional(),
  platform: z.string().optional(),
  instanceId: z.string().optional(),
  identity: z.string(),
  requestId: z.string(),
  userId: z.string(),
  userIP: z.string(),
  sourceIp: z.string(),
  claims: z.record(z.any()).optional(),
  headers: z.record(z.any()).optional(),
  isAnonymous: z.boolean(),
  sessionId: z.string().optional(),
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

export interface KeyValue {
  [key: string]: any;
}

export interface KeyValueString {
  [key: string]: string;
}

export interface AWSResponse<T = any> {
  statusCode: number;
  body?: T;
  headers?: KeyValueString;
}
export interface Response<T = any> extends AWSResponse<T> {
  isBase64Encoded?: boolean;
}
export interface Request<T = any> {
  httpMethod: string;
  body?: T;
  headers: KeyValueString;
  queryStringParams: Record<string, any>;
  pathParameters?: Record<string, any>
}

export interface State<PUB = KeyValue, PRIV = KeyValue> {
  public: PUB;
  private: PRIV;
}

export interface Job {
  classId: string;
  instanceId: string;
  referenceKey?: {
      name: string;
      value: string;
  };
  body?: any;
  methodName: string;
  after: number;
}

export interface Data<I = any, O = any, PUB = KeyValue, PRIV = KeyValue> {
  context: Context;
  state: State<PUB, PRIV>;
  request: Request<I>;
  response: Response<O>;
  jobs: Job[];
}
