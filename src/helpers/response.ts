export interface ResponseArguments<T> {
  statusCode: number
  message?: string
  addons?: T | undefined
  body?: T | undefined
  headers?: {}
  isBase64Encoded?: boolean
}

export interface ExaminatorResponse {
  statusCode: number
  body: string
  headers?: {}
  isBase64Encoded?: boolean
}

export class Response<T = unknown> extends Error {
  public readonly code: number

  public readonly statusCode: number
  
  public readonly message: string
  
  public body?: T = undefined
  
  public addons?: T = undefined

  public headers? = {}

  public isBase64Encoded?: boolean

  constructor(errorArguments: ResponseArguments<T>) {
    super('')
    const { message, statusCode, addons, body, headers, isBase64Encoded } = errorArguments
    this.statusCode = statusCode
    
    this.addons = addons || {} as T
    this.message = message || ''
    this.headers = headers || {} 
    this.body = body
    this.isBase64Encoded = isBase64Encoded || false
    Object.setPrototypeOf(this, Response.prototype)
  }

  get response(): ExaminatorResponse {
    const body = this.body || { message: this.message, ...this.addons }
    return {
      statusCode: this.statusCode,
      body: JSON.stringify(body),
      headers: this.headers,
      isBase64Encoded: this.isBase64Encoded,
    }
  }
}
