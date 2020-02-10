import { IVpc } from '@aws-cdk/aws-ec2';
import { Table, AttributeType } from '@aws-cdk/aws-dynamodb';
import { Construct, RemovalPolicy } from '@aws-cdk/core';
import { Config } from '../config';

export interface DynamoParameters {
  config: Config,
  scope: Construct,
  vpc: IVpc,
}

export class DynamoResource {
  public readonly table: Table;

  constructor(args: DynamoParameters) {
    this.table = new Table(args.scope, 'items', {
      partitionKey: {
        name: 'itemId',
        type: AttributeType.STRING
      },
      tableName: 'items',      
      removalPolicy: RemovalPolicy.RETAIN,
    });
  }
}
