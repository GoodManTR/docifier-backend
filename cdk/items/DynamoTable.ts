import { AttributeType, BillingMode, ProjectionType, StreamViewType, Table } from 'aws-cdk-lib/aws-dynamodb'
import { Construct } from 'constructs'

export class InstanceStateTable extends Construct {
    public readonly authenticationTable: Table
    public readonly profileTable: Table
    public readonly sessionTable: Table
    public readonly docTable: Table
    public readonly docTreeTable: Table
    public readonly imageTable: Table
    public readonly docSheetTable: Table

    constructor(scope: Construct, id: string) {
      super(scope, id);
  
      this.authenticationTable = new Table(this, 'AuthenticationTable', {
        partitionKey: {
          name: 'email',
          type: AttributeType.STRING,
        },
        billingMode: BillingMode.PAY_PER_REQUEST,
        stream: StreamViewType.NEW_IMAGE,
        tableName: 'AuthenticationTable',
      })

      this.profileTable = new Table(this, 'ProfileTable', {
        partitionKey: {
          name: 'userId',
          type: AttributeType.STRING,
        },
        billingMode: BillingMode.PAY_PER_REQUEST,
        stream: StreamViewType.NEW_IMAGE,
        tableName: 'ProfileTable',
      })
  
      this.sessionTable = new Table(this, 'SessionTable', {
        partitionKey: {
          name: 'userId',
          type: AttributeType.STRING,
        },
        billingMode: BillingMode.PAY_PER_REQUEST,
        stream: StreamViewType.NEW_IMAGE,
        timeToLiveAttribute: 'expiresAt',
        tableName: 'SessionTable',
      })

      this.docTable = new Table(this, 'DocTable', {
        partitionKey: {
          name: 'docId',
          type: AttributeType.STRING,
        },
        billingMode: BillingMode.PAY_PER_REQUEST,
        stream: StreamViewType.NEW_IMAGE,
        tableName: 'DocTable',
      })

      this.docTreeTable = new Table(this, 'DocTreeTable', {
        partitionKey: {
          name: 'docId',
          type: AttributeType.STRING,
        },
        billingMode: BillingMode.PAY_PER_REQUEST,
        stream: StreamViewType.NEW_IMAGE,
        tableName: 'DocTreeTable',
      })

      this.docSheetTable = new Table(this, 'DocSheetTable', {
        partitionKey: {
          name: 'sheetId',
          type: AttributeType.STRING,
        },
        billingMode: BillingMode.PAY_PER_REQUEST,
        stream: StreamViewType.NEW_IMAGE,
        tableName: 'DocSheetTable',
      })

      this.imageTable = new Table(this, 'ImageTable', {
        partitionKey: {
          name: 'imageId',
          type: AttributeType.STRING,
        },
        billingMode: BillingMode.PAY_PER_REQUEST,
        stream: StreamViewType.NEW_IMAGE,
        tableName: 'ImageTable',
      })
    }
  }