import { InstanceType, ISecurityGroup, IVpc, SubnetType } from '@aws-cdk/aws-ec2';
import * as rds from '@aws-cdk/aws-rds';
import { ClusterParameterGroup, DatabaseCluster } from '@aws-cdk/aws-rds';
import { Secret } from '@aws-cdk/aws-secretsmanager';
import { Construct } from '@aws-cdk/core';
import { Config } from '../config';

export interface RdsParameters {
  config: Config,
  scope: Construct,
  securityGroup: ISecurityGroup,
  vpc: IVpc,
}

export class RdsResource {
  public readonly secret: Secret;
  public readonly databaseCluster: DatabaseCluster;
  public readonly clusterParameterGroup: ClusterParameterGroup;

  constructor(args: RdsParameters) {
    this.secret = new Secret(args.scope, `${args.config.prefix}DatabasePassword`, {
      description: 'Generated password for cdk database',
      generateSecretString: {
        passwordLength: 20,
        excludePunctuation: true,
      }
    });

    this.clusterParameterGroup = new ClusterParameterGroup(args.scope,
      `${args.config.prefix}RdsParameterGroup`, {
      family: 'aurora-postgres11.5',
      description: `${args.config.prefix} PostgreSQL 11.5 parameter group`,
      parameters: {
        client_encoding: 'utf8',
      }
    });

    this.databaseCluster = new DatabaseCluster(args.scope, `${args.config.prefix}DatabaseCluster`, {
      clusterIdentifier: `${args.config.prefix}DatabaseCluster`,
      engine: rds.DatabaseClusterEngine.AURORA_POSTGRESQL,
      defaultDatabaseName: args.config.rdsDatabaseName,
      port: args.config.rdsDatabasePort,
      masterUser: {
        username: 'admin',
        password: this.secret.secretValue
      },
      instances: args.config.rdsInstances,
      instanceProps: {
        instanceType: InstanceType.of(args.config.rdsInstanceClass, args.config.rdsInstanceSize),
        vpc: args.vpc,
        securityGroup: args.securityGroup,
        vpcSubnets: {
          subnetType: SubnetType.PUBLIC,
        },
      },
      parameterGroup: this.clusterParameterGroup
    });
  }
}
