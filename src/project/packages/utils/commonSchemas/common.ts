import { z } from 'zod'

export const acceptableCultures = z.enum(['tr_TR', 'en_US'])
export const platformEnum = z.enum(['WEB', 'IOS', 'ANDROID', 'HUAWEI'])
export const stages = z.enum(['dev', 'test', 'uat', 'preprod', 'prod'])
export const userIdentities = z.enum(['enduser', 'none'])
export const classIdentities = z.enum([
  'User',
  'Authenticator',
])
