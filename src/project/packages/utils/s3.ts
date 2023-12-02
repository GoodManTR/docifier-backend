import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3 } from '@aws-sdk/client-s3'

const s3 = new S3({})

export async function resolveStream(stream: any, raw = false): Promise<Buffer | string> {
    return new Promise((resolve, reject) => {
        const chunks: any[] = []
        stream.on('data', (chunk: any) => chunks.push(chunk))
        stream.on('error', reject)
        stream.on('end', () => resolve(raw ? Buffer.concat(chunks) : Buffer.concat(chunks).toString('utf8')))
    })
}

export const uplaodFile = async (bucketName: string, keyName: string, file: any) => {
    return await s3.send(
        new PutObjectCommand({
            Bucket: bucketName,
            Key: keyName,
            Body: file,
        }),
    ).catch((err) => {
        throw new Error(err)
    })
}

export const deleteFile = async (bucketName: string, keyName: string) => {
    return await s3.send(
        new DeleteObjectCommand({
            Bucket: bucketName,
            Key: keyName
        }),
    ).catch((err) => {
        throw new Error(err)
    })
}

export const getFile = async (bucketName: string, keyName: string) => {
    const s3File = await s3
        .send(
            new GetObjectCommand({
                Bucket: bucketName,
                Key: keyName,
            }),
        )
        .catch((err) => {
            throw new Error(err)
        })

    return await resolveStream(s3File.Body)
}