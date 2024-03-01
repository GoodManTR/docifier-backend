import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, BatchWriteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { GENERAL_TABLE } from '../constants'
import { DeleteInstanceInput } from 'core/models/instance.model'

const dynamodb = new DynamoDBClient({})
const ddb = DynamoDBDocumentClient.from(dynamodb)

export function getReferenceKeyPrimaryKey(referenceKey: any): string {
  return ['RK', referenceKey.classId, referenceKey.key.name, referenceKey.key.value].join('#')
}

export async function getReferenceKeys(event: DeleteInstanceInput, items: any[] = [], paginationToken?: any): Promise<any[]> {
  const { classId, instanceId } = event
  const id = [classId, instanceId].filter((i) => i).join('#')
  return ddb
    .send(
      new QueryCommand({
        TableName: GENERAL_TABLE,
        IndexName: 'instanceIdIndex',
        KeyConditionExpression: 'instanceId = :instanceId',
        ExpressionAttributeValues: { ':instanceId': id },
        ExclusiveStartKey: paginationToken,
      }),
    )
    .then((result) => {
      if (Array.isArray(result.Items))
        items.push(
          ...(result.Items.map(({ part }) => {
            const [projectId, sort, classId, name, value] = part.split('#')
            if (sort !== 'RK') return undefined

            return {
              projectId,
              classId,
              key: { name, value },
            }
          }).filter((i) => i) as any[]),
        )
      if (result.LastEvaluatedKey) return getReferenceKeys(event, items, result.LastEvaluatedKey)
      return items
    })
}

export async function deleteFromReferenceKeyTable(referenceKeyItems: any[]): Promise<any[]> {
  const deleteRequests = referenceKeyItems.map((referenceKey) => ({
    DeleteRequest: {
      Key: {
        part: getReferenceKeyPrimaryKey(referenceKey),
        sort: 'RK',
      },
    },
  }))
  return ddb
    .send(
      new BatchWriteCommand({
        RequestItems: {
          [GENERAL_TABLE!]: deleteRequests,
        },
      }),
    )
    .then(({ UnprocessedItems }) => {
      const unsuccessfulWriteItems = new Set<string>()
      if (UnprocessedItems && UnprocessedItems[GENERAL_TABLE!]) {
        UnprocessedItems[GENERAL_TABLE!].forEach((r: any) => {
          const item = r.PutRequest?.Item || r.DeleteRequest?.Key
          if (!item) return
          const { part } = item
          unsuccessfulWriteItems.add(part)
        })
      }
      return referenceKeyItems.map((i) => {
        return { success: !unsuccessfulWriteItems.has(getReferenceKeyPrimaryKey(i)) }
      })
    })
}
