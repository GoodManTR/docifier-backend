import { PutObjectCommand, S3 } from '@aws-sdk/client-s3'

const s3 = new S3({})

export const uplaodFile = async (bucketName: string, keyName: string, file: any) => {
    await s3.send(
        new PutObjectCommand({
            Bucket: bucketName,
            Key: keyName,
            Body: file,
        }),
    ).catch((err) => {
        throw new Error(err)
    })
}