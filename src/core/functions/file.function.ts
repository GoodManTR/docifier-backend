import { DeleteObjectCommand, GetObjectCommand, GetObjectCommandOutput, HeadObjectCommand, PutObjectAclCommandOutput, PutObjectCommand, S3, S3Client, S3ClientConfig } from '@aws-sdk/client-s3'
import { getBucketName } from '../constants'
import { DeleteFileInput, DeleteFileOutput, GetFileInput, GetFileOutput, SetFileInput, SetFileOutput } from '../models/file.model'
import { isSuccess } from '../helpers'

const s3 = new S3Client({})
const AWS_BUCKET_NAME = getBucketName()

export function buildFileStoragePath(fileName: string): string {
  return ['files', fileName].join('/')
}

export async function setFile(file: SetFileInput): Promise<SetFileOutput> {
  if (typeof file.body !== 'string') throw new Error('file body must be a string')

  let success = true
  let fileError = undefined

  try {
    const setFileResponse = await s3.send(
      new PutObjectCommand({
        Bucket: AWS_BUCKET_NAME,
        Key: buildFileStoragePath(file.filename),
        Body: file.body,
      }),
    )

    success = isSuccess(setFileResponse.$metadata.httpStatusCode)
  } catch (error) {
    success = false
    fileError = error
  }

  return {
    success,
    error: fileError,
  }
}

export async function getFile(file: GetFileInput): Promise<GetFileOutput> {
  let success = true
  let fileError = undefined
  let data: any = undefined

  try {
    const getFileResponse = await s3.send(
      new GetObjectCommand({
        Bucket: AWS_BUCKET_NAME,
        Key: buildFileStoragePath(file.filename),
      }),
    )

    success = isSuccess(getFileResponse.$metadata.httpStatusCode)
    data = success ? await getFileResponse.Body?.transformToString() : undefined
  } catch (error) {
    success = false
    fileError = error
  }

  return {
    success,
    error: fileError,
    data,
  }
}

export async function deleteFile(file: DeleteFileInput): Promise<DeleteFileOutput> {
  let success = true
  let fileError = undefined

  try {
    const deleteFileResponse = await s3.send(
      new DeleteObjectCommand({
        Bucket: AWS_BUCKET_NAME,
        Key: buildFileStoragePath(file.filename),
      }),
    )

    success = isSuccess(deleteFileResponse.$metadata.httpStatusCode)
  } catch (error) {
    success = false
    fileError = error
  }
  return {
    success,
    error: fileError,
  }
}
