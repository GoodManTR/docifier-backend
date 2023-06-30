import { ParsedPath, ResizedImageParameters, removeImageInput, resizedImageParameters, uploadInput } from './models'
import { customAlphabet } from 'nanoid'
import { gunzipSync, gzipSync } from 'zlib'
import { DeleteCommand, DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'
import { IMAGE_BUCKET, IMAGE_TABLE } from '../../helpers/constants'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { deleteFile, getFile, uplaodFile } from '../../helpers/s3'
import * as Jimp from 'jimp'
import { Context } from '../../models'
import { CustomError, Errors, SuccessResponse } from '../../helpers/response-manager'

const client = new DynamoDBClient({})
const dynamo = DynamoDBDocumentClient.from(client)

const qualities = {
    default: 25,
    high: 100,
    medium: 50,
    low: 15,
}

function generateImageId() {
    const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-', 10)
    return nanoid()
}

const getResizedImage = async ({ height, width, quality, content, fit }: ResizedImageParameters) => {
    const image = await Jimp.read(content)
    const resized = image.resize(width, height, fit)
    const qualitied = resized.quality(qualities[quality])
    const buffer = await qualitied.getBase64Async(Jimp.MIME_PNG)
    return buffer
}

const parsePath = (path: string): ParsedPath => {
    const ids = path.split('.')[0].split('_')
    if (ids.length < 2 || ids.length > 4 || !path.includes('.')) {
        throw new Error('parse')
    }

    const quality = ids.length > 2 ? ids[2] : undefined
    const fit = ids.length > 3 ? ids[3] : undefined
    const parameterObject = {
        imageId: ids[0],
        width: ids[1].split('x')[0],
        height: ids[1].split('x')[1],
        quality,
        format: path.split('.')[1],
        fit,
    }

    return parameterObject
}

// *******************************
// *******************************
// ***** LAMBDA HANDLERS  ********
// *******************************
// *******************************

export const get = async (context: Context) => {
    try {
        let cacheDuration = 31_536_000

        const p = context.path

        if (!p) {
            throw new CustomError({ error: Errors.Image[5000] })
        }

        const path = parsePath(p)

        let file = await getFile(IMAGE_BUCKET, path.imageId)

        if (!file) {
            throw new CustomError({ error: Errors.Image[5001] })
        }


        const compressedBuffer = Buffer.from(file.toString('base64'), 'base64');
        const decompressedBuffer = gunzipSync(compressedBuffer);

        const parameters: ResizedImageParameters = resizedImageParameters.parse({
            content: decompressedBuffer,
            id: path.imageId,
            width: path.width,
            height: path.height,
            quality: path.quality,
            fit: path.fit,
        })

        const resizedImage = await getResizedImage(parameters)

        const uri = resizedImage.split(';base64,').pop()
        return {
            statusCode: 200,
            body: uri,
            isBase64Encoded: true,
            headers: {
                'Content-Type': 'image/jpg',
                //'Cache-Control': `max-age=${cacheDuration}`,
            },
        }
    } catch (error) {
        return error instanceof CustomError
            ? error.friendlyResponse
            : new CustomError('System', 1000, 500, { issues: (error as Error).message }).friendlyResponse
    }
}

export const remove = async (context: Context) => {
    try {
        const input = removeImageInput.safeParse(context.body)

        if (input.success === false) {
            throw new CustomError({ error: Errors.Image[5000], addons: { issues: input.error.issues } })
        }

        const { imageId } = input.data

        await deleteFile(IMAGE_BUCKET, imageId)

        const dynamoReq = await dynamo.send(
            new DeleteCommand({
                TableName: IMAGE_TABLE,
                Key: {
                    imageId,
                },
            }),
        )

        if (dynamoReq.$metadata.httpStatusCode !== 200) {
            throw new CustomError({ error: Errors.Image[5000], addons: { error: dynamoReq } })
        }
        return new SuccessResponse({
            body: 'Succesfully deleted image.',
        }).response
    } catch (error) {
        return error instanceof CustomError
            ? error.friendlyResponse
            : new CustomError('System', 1000, 500, { issues: (error as Error).message }).friendlyResponse
    }
}

export const upload = async (context: Context) => {
    try {
        const input = uploadInput.safeParse(context.body)

        if (input.success === false) {
            throw new CustomError({ error: Errors.Image[5000], addons: { issues: input.error.issues } })
        }

        const { name } = input.data
        let { imageId, content } = input.data

        if (!imageId) {
            imageId = generateImageId()
        }

        if (Buffer.from(content, 'base64').toString('base64') !== content) {
            throw new CustomError({ error: Errors.Image[5002] })
        }

        content = gzipSync(Buffer.from(content, 'base64')).toString('base64')

        await uplaodFile(IMAGE_BUCKET, imageId, content)

        const dynamoReq = await dynamo.send(
            new PutCommand({
                TableName: IMAGE_TABLE,
                Item: {
                    imageId,
                    name,
                },
            }),
        )

        if (dynamoReq.$metadata.httpStatusCode !== 200) {
            throw new CustomError({ error: Errors.Image[5000], addons: { error: dynamoReq } })
        }

        return new SuccessResponse({
            body: 'Succesfully uploaded image.'
        }).response
    } catch (error) {
        return error instanceof CustomError
            ? error.friendlyResponse
            : new CustomError('System', 1000, 500, { issues: (error as Error).message }).friendlyResponse
    }
}
