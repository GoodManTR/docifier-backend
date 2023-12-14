import { AttributeType, BillingMode, ProjectionType, StreamViewType, Table } from 'aws-cdk-lib/aws-dynamodb'
import { Construct } from 'constructs'

export class DynamoTable extends Construct {
    public readonly DatabaseTable: Table
    public readonly authenticationTable: Table
    public readonly profileTable: Table
    public readonly sessionTable: Table
    public readonly docTable: Table
    public readonly docTreeTable: Table
    public readonly imageTable: Table
    public readonly docSheetTable: Table

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
        stream: StreamViewType.NEW_IMAGE,
        tableName: 'DatabaseTable',
      })

    }
  }