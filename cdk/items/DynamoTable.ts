import { AttributeType, BillingMode, ProjectionType, StreamViewType, Table } from 'aws-cdk-lib/aws-dynamodb'
import { Construct } from 'constructs'

export class DynamoTable extends Construct {
    public readonly DatabaseTable: Table
    public readonly ConcurrencyTable: Table

    constructor(scope: Construct, id: string) {
      super(scope, id);

      this.DatabaseTable = new Table(this, 'DatabaseTable', {
        partitionKey: {
          name: 'part',
          type: AttributeType.STRING,
        },
        sortKey: {
          name: 'sort',
          type: AttributeType.STRING,
        },
        billingMode: BillingMode.PAY_PER_REQUEST,
        pointInTimeRecovery: true,
        timeToLiveAttribute: 'expiresAt',
        tableName: 'DatabaseTable',
      })

      this.ConcurrencyTable = new Table(this, 'ConcurrencyTable', {
        partitionKey: {
          name: 'part',
          type: AttributeType.STRING,
        },
        billingMode: BillingMode.PAY_PER_REQUEST,
        timeToLiveAttribute: 'expiresAt',
        tableName: 'ConcurrencyTable',
      })

    }
  }