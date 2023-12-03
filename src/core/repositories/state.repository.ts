import zlib from 'zlib'
import { GetObjectCommand, HeadObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { resolveStream } from './fileStorage.repository'
import { getBucketName } from '../constants'
import { Upload } from '@aws-sdk/lib-storage'

const AWS_BUCKET_NAME = getBucketName()

const s3 = new S3Client({})

function getS3Path(classId: string, instanceId: string, fileName: string) {
      return ['instances', classId, instanceId, fileName].join('/') + '.json'
}

export async function putState(classId: string, instanceId: string, data: any): Promise<void> {
    const finalData = JSON.stringify(data)
    const zippedData = zlib.gzipSync(finalData)
    const instanceDataS3Path = getS3Path(classId, instanceId!, 'instanceData')

    const ops: Promise<any>[] = []
    ops.push(
        new Upload({
            client: s3,
            params: {
                Bucket: AWS_BUCKET_NAME,
                Key: instanceDataS3Path,
                Body: zippedData,
                ContentType: 'application/json',
                ContentEncoding: 'gzip',
            },
        }).done(),
    )

    await Promise.all(ops)
}

export async function fetchStateFromS3(classId: string, instanceId: string): Promise<any> {
    const path = getS3Path(classId, instanceId, 'instanceData')
    const instanceDataBlob = await s3.send(
        new GetObjectCommand({
            Bucket: AWS_BUCKET_NAME,
            Key: path,
        }),
    )
    if (!instanceDataBlob || !instanceDataBlob.Body) {
        throw new Error('eror')
    }

    const content = zlib.unzipSync(await resolveStream(instanceDataBlob.Body, true)).toString('utf8')
  
    return JSON.parse(content) 
  }

  export async function checkInstance(classId: string, instanceId: string): Promise<boolean> {
    try {
        if (!instanceId) return false

        const instanceDataPath = getS3Path(classId, instanceId!, 'instanceData')
        await s3.send(new HeadObjectCommand({ Bucket: AWS_BUCKET_NAME, Key: instanceDataPath }))

        return true
    } catch (e) {
        // ? if ((e as NotFound)?.$metadata?.httpStatusCode !== 404) console.log(e)
        return false
    }
}