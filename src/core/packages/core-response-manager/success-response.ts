import { APIGatewayProxyResult } from 'aws-lambda';
import * as z from 'zod';
import { Response } from '../../../core/models/data.model';

// Define a schema for the response headers
const ResponseHeadersSchema = z.record(z.string());

// Define a schema for the response object
const ResponseSchema = z.object({
  statusCode: z.number(),
  body: z.string(),
  headers: ResponseHeadersSchema.optional(),
});

export class SuccessResponse {
  public readonly message?: string

  public readonly body?: any = undefined

  public readonly statusCode: number 

  public readonly headers: object

  constructor(data: {
    statusCode?: number,
    message?: string,
    body?: any,
    headers?: object
  }) {
    const { statusCode, message, body: responseBody, headers } = data;
    
    this.statusCode = statusCode ?? 200;
    this.message = message;
    this.body = responseBody || {};
    this.headers = headers || {};
  }

  get response(): Response {
    const responseBody = JSON.stringify(this.body);
    
    const response = ResponseSchema.parse({
      statusCode: this.statusCode,
      body: responseBody,
      headers: {...this.headers,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Expose-Headers': '*',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE',
        'Access-Control-Allow-Headers': '*',
        'Content-Type': 'application/json',
      },
    });

    return response;
  }
}