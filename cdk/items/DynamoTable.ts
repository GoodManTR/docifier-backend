import { AttributeType, BillingMode, ProjectionType, StreamViewType, Table } from 'aws-cdk-lib/aws-dynamodb'
import { Construct } from 'constructs'

export class InstanceStateTable extends Construct {
    public readonly userTable: Table
    public readonly sessionTable: Table
    public readonly productsTable: Table

    constructor(scope: Construct, id: string) {
      super(scope, id);
  
      this.userTable = new Table(this, 'UserTable', {
        partitionKey: {
          name: 'email',
          type: AttributeType.STRING,
        },
        billingMode: BillingMode.PAY_PER_REQUEST,
        stream: StreamViewType.NEW_IMAGE,
        tableName: 'UserTable',
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

      this.productsTable = new Table(this, 'ProductsTable', {
        partitionKey: {
          name: 'productId',
          type: AttributeType.STRING,
        },
        billingMode: BillingMode.PAY_PER_REQUEST,
        stream: StreamViewType.NEW_IMAGE,
        tableName: 'ProductsTable',
      })
    }
  }