import * as sharp from 'sharp'
import { ParsedPath, ResizedImageParameters, uploadInput } from './models'
import { Response } from '../../helpers/response'
import { APIGatewayProxyEventV2 } from 'aws-lambda'
import { customAlphabet } from 'nanoid'
import { gzipSync } from 'zlib'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'
import { IMAGE_TABLE } from '../../helpers/constants'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { uplaodFile } from '../../helpers/s3'

const client = new DynamoDBClient({})
const dynamo = DynamoDBDocumentClient.from(client)

const qualities: Record<string, number> = {
    default: 25,
    high: 100,
    medium: 50,
    low: 15,
}

export function generateImageId() {
    const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-', 10)
    return nanoid()
}

const getResizedImage = async ({ height, width, quality, content, fit }: ResizedImageParameters): Promise<Buffer> =>
  sharp(content)
    .resize(width, height, {
      fit,
    })
    .toFormat('png', { quality: qualities[quality] })
    .toBuffer()

// *******************************
// *******************************
// ***** LAMBDA HANDLERS  ********
// *******************************
// *******************************

export const upload = async (event: APIGatewayProxyEventV2) => {
    try {
        const input = uploadInput.safeParse(JSON.parse(event.body || '{}'))

        if (input.success === false) {
            throw new Response({
                statusCode: 400,
                message: 'Woops! It looks like you sent us the wrong data. Double-check your request and try again.',
                addons: { issues: input.error.issues },
            })
        }

        const { imageType, name } = input.data
        let { imageId, content } = input.data

        if (!imageId) {
            imageId = generateImageId()
        }

        if (Buffer.from(content, 'base64').toString('base64') !== content) {
            throw new Response({
                statusCode: 400,
                message: 'Content is not base-64 format!',
            })
        }

        content = gzipSync(Buffer.from(content, 'base64')).toString('base64')

        await uplaodFile('bucketName', imageId, content)

        const dynamoReq = await dynamo.send(
            new PutCommand({
                TableName: IMAGE_TABLE,
                Item: {
                    imageId,
                    name
                }
            }),
        )

        if (dynamoReq.$metadata.httpStatusCode !== 200) {
            throw new Response({ statusCode: 400, message: 'Database Error, please contact admin !', addons: { error: dynamoReq } })
        }

        return new Response({ statusCode: 200, body: "Succesfully upserted product." }).response
    } catch (error) {
        return error instanceof Response ? error.response : new Response({ statusCode: 400, message: 'Generic Error', addons: { error: error } }).response
    }
}