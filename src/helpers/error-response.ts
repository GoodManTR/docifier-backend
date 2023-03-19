import { z } from "zod"

interface TErrorMessages {
    System: BaseError[]
    Auth: BaseError[]
    Image: BaseError[]
    Product: BaseError[]
    Api: BaseError[]
}

type Locales = 'tr_TR' | 'en_US' | 'tr-tr' | 'en-us'

export const friendlyMessage = z.object({
    message: z.string(),
    title: z.string(),
  })
export type FriendlyMessage = z.infer<typeof friendlyMessage>

interface BaseError {
    code: number
    message: string
}

type ClassKey = keyof TErrorMessages

export interface ErrorType {
    classId: ClassKey
    code: number
    statusCode: number
    message: { [key in Locales]?: string }
    title?: { [key in Locales]?: string }
}

interface CustomErrorArguments<T> {
    error: ErrorType
    localization?: string
    addons?: T | undefined
    params?: { [key in string]: string }
}

interface ErrorResponseBody {
    [key: string]: unknown
    classId: string
    code: number
    message?: string
    _friendlyMessage?: FriendlyMessage
  }

interface ErrorResponse {
    statusCode: number
    body: ErrorResponseBody
  }

export class CustomError<T = unknown> extends Error {
    public readonly classId: ClassKey

    public readonly code: number

    public readonly statusCode: number

    public issues?: T = undefined

    public readonly message: string

    public title?: string = 'Error Message'

    constructor(classId: ClassKey, code: number, statusCode?: number, issues?: T)
    constructor(errorArguments: CustomErrorArguments<T>)
    constructor(...arguments_: any[]) {
        super('')

        if (typeof arguments_[0] === 'string') {
            const classId = arguments_[0] as ClassKey
            const code = arguments_[1] as number
            const statusCode = arguments_[2] as number
            const issues = arguments_[3] as T

            this.code = code
            this.statusCode = statusCode || 400
            this.issues = issues
            this.classId = classId

            Object.setPrototypeOf(this, CustomError.prototype)
        } else if (typeof arguments_[0] === 'object') {
            const { error, addons, params } = arguments_[0] as CustomErrorArguments<T>
            const localization = 'tr_TR'
            const { classId, statusCode, code, message, title } = error
            this.message = localization && message[localization] ? (message[localization] as string) : message.en_US ?? 'no message provided'
            if (title) {
                this.title = localization && title && title[localization] ? (title[localization] as string) : title.en_US ?? 'Error Message'
            }

            if (params && typeof params === 'object') {
                // eslint-disable-next-line guard-for-in
                for (const key in params) {
                    this.message = this.message.replace(`{{${key}}}`, params[key])
                }
            }

            this.code = code
            this.statusCode = statusCode
            this.issues = addons
            this.classId = classId

            Object.setPrototypeOf(this, CustomError.prototype)
        }
    }

    get response() {
        const responseBody = JSON.stringify({
            code: this.code,
            classId: this.classId,
            title: this.title,
            message: this.message,
            ...this.issues,
        });
        return {
            statusCode: this.statusCode,
            body: responseBody,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Expose-Headers': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE',
                'Access-Control-Allow-Headers': '*',
            }
        }
    }

    get friendlyResponse() {
        const responseBody = JSON.stringify({
            code: this.code,
            classId: this.classId,
            title: this.title,
            message: this.message,
            _friendlyMessage: {
                title: this.title || '',
                message: this.message || '',
            },
            ...this.issues,
        });
        return {
            statusCode: this.statusCode,
            body: responseBody,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Expose-Headers': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE',
                'Access-Control-Allow-Headers': '*',
            }
        }
    }

    get responseBody() {
        return this.response.body
    }
}
