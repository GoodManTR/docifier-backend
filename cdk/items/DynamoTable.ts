import { AttributeType, BillingMode, ProjectionType, StreamViewType, Table } from 'aws-cdk-lib/aws-dynamodb'
import { Construct } from 'constructs'

export class DynamoTable extends Construct {
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

      this.docTable = new Table(this, 'DocumentationTable', {
        partitionKey: {
          name: 'documentationId',
          type: AttributeType.STRING,
        },
        billingMode: BillingMode.PAY_PER_REQUEST,
        stream: StreamViewType.NEW_IMAGE,
        tableName: 'DocumentationTable',
      })

      this.docTreeTable = new Table(this, 'DocumentationTreeTable', {
        partitionKey: {
          name: 'documentationId',
          type: AttributeType.STRING,
        },
        billingMode: BillingMode.PAY_PER_REQUEST,
        stream: StreamViewType.NEW_IMAGE,
        tableName: 'DocumentationTreeTable',
      })

      this.docSheetTable = new Table(this, 'DocumentTable', {
        partitionKey: {
          name: 'documentId',
          type: AttributeType.STRING,
        },
        billingMode: BillingMode.PAY_PER_REQUEST,
        stream: StreamViewType.NEW_IMAGE,
        tableName: 'DocumentTable',
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