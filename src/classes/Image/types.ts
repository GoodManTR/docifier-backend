import { z } from "zod"

export const methods = z.enum([
    'upload',
    'remove',
    'get',
])

export const allowedMethods = z.enum([
    'get'
])
