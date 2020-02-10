import { InstanceClass, InstanceSize } from '@aws-cdk/aws-ec2';
import { Duration } from '@aws-cdk/core';

export enum Stage {
    DEV = 'Dev',
    INT = 'Int',
    PROD = 'Prod',
}

export interface Config {
    ami: string;
    prefix?: string;
    ssl: boolean;
    ebApplicationName: string;
    ebEnvironmentName: string;
    ebPlatformArn: string;
    ebAutoScaleMinInstanceCount: number;
    ebAutoScaleMaxInstanceCount: number;
    ebAutoScaleCpuUpperThreshold: number;
    ebAtutoScaleCpuLowerThreshold: number;
    ebInstanceClass: InstanceClass;
    ebInstanceSize: InstanceSize;
    ebRollingUpdate: boolean;
    dynamoPartitionKey: string;
    dynamoTableName: string;
    lambdaTimeout: Duration;
    rdsDatabaseName: string;
    rdsDatabasePort: number;
    rdsInstances: number;
    rdsInstanceClass: InstanceClass;
    rdsInstanceSize: InstanceSize;
    sgIngressWhitelist: string[];
    sgEgressWhitelist: string[];
    sshWhitelist: string[];
    vpcMaxAvailabilityZones: number;
}

export const defaultConfig: Config = {
    ami: 'ami-03caa3f860895f82e',
    prefix: 'Test-',
    ssl: false,
    ebApplicationName: 'testApplication',
    ebEnvironmentName: 'testEnvironment',
    ebPlatformArn: 'arn:aws:elasticbeanstalk:us-west-2::platform/(BETA) Corretto 8 running on 64bit Amazon Linux 2/0.1.1',
    ebAutoScaleMinInstanceCount: 1,
    ebAutoScaleMaxInstanceCount: 2,
    ebAutoScaleCpuUpperThreshold: 80,
    ebAtutoScaleCpuLowerThreshold: 40,
    ebInstanceClass: InstanceClass.T2,
    ebInstanceSize: InstanceSize.MICRO,
    ebRollingUpdate: true,
    dynamoPartitionKey: 'testPartitionKey',
    dynamoTableName: 'testTable',
    lambdaTimeout: Duration.seconds(10),
    rdsDatabaseName: 'Test',
    rdsDatabasePort: 3306,
    rdsInstances: 1,
    rdsInstanceClass: InstanceClass.T2,
    rdsInstanceSize: InstanceSize.MICRO,
    sgIngressWhitelist: ['216.9.28.196/32', '10.0.0.0/16'],
    sgEgressWhitelist: ['216.9.28.196/32'],
    sshWhitelist: ['216.9.28.196/32'],
    vpcMaxAvailabilityZones: 1,
};