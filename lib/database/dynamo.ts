import { AttributeType, Table } from '@aws-cdk/aws-dynamodb';
import { IVpc } from '@aws-cdk/aws-ec2';
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
    this.table = new Table(args.scope, `${args.config.prefix}-DynamoTable-${args.config.dynamoTableName}`, {
      partitionKey: {
        name: args.config.dynamoPartitionKey,
        type: AttributeType.STRING
      },
      tableName: args.config.dynamoTableName,
      removalPolicy: RemovalPolicy.RETAIN,
    });
  }
}
