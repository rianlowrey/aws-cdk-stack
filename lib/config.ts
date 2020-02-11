import { InstanceClass, InstanceSize } from '@aws-cdk/aws-ec2';
import { Duration } from '@aws-cdk/core';

export enum Stage {
    DEV = 'Dev',
    INT = 'Int',
    PROD = 'Prod',
}

export interface Config {
    ami: string;
    domainName: string;
    prefix?: string;
    ssl: boolean;
    ebApplicationName: string;
    ebEnvironmentName: string;
    ebPlatformArn: string;
    ebAutoScaleMinInstanceCount: number;
    ebAutoScaleMaxInstanceCount: number;
    ebAutoScaleCpuUpperThreshold: number;
    ebAutoScaleCpuLowerThreshold: number;
    ebElasticLoadBalancerListenPort: number;
    ebSolutionStackName: string;
    ebTomcatJvmOptions: string;
    ebTomcatMinHeapSize: string;
    ebTomcatMaxHeapSize: string;
    ebTomcatPermSize: string;
    ebInstanceClass: InstanceClass;
    ebInstanceSize: InstanceSize;
    ebRollingUpdate: boolean;
    dynamoPartitionKey: string;
    dynamoTableName: string;
    lambdaTimeoutSeconds: Duration;
    rdsDatabaseName: string;
    rdsDatabasePort: number;
    rdsInstances: number;
    rdsInstanceClass: InstanceClass;
    rdsInstanceSize: InstanceSize;
    sgIngressWhitelist: string[];
    sgEgressWhitelist: string[];
    sshWhitelist: string[];
    sslCertificateArn: string;
    vpcMaxAvailabilityZones: number;
}

export const defaultConfig: Config = {
    ami: 'ami-03caa3f860895f82e',
    domainName: 'testDomain.com',
    prefix: 'Test-',
    ssl: false,
    ebApplicationName: 'testApplication',
    ebEnvironmentName: 'testEnvironment',
    ebPlatformArn: 'arn:aws:elasticbeanstalk:us-west-2::platform/(BETA) Corretto 8 running on 64bit Amazon Linux 2/0.1.1',
    ebAutoScaleMinInstanceCount: 1,
    ebAutoScaleMaxInstanceCount: 2,
    ebAutoScaleCpuUpperThreshold: 80,
    ebAutoScaleCpuLowerThreshold: 40,
    ebElasticLoadBalancerListenPort: 80,
    ebInstanceClass: InstanceClass.T2,
    ebInstanceSize: InstanceSize.MICRO,
    ebSolutionStackName: '64bit Amazon Linux 2 v0.1.1 running Corretto 8 (BETA)',
    ebTomcatJvmOptions: [
        '-server',
        '-XX:+UseConcMarkSweepGC',
        '-XX:+UseParNewGC',
        '-Djava.net.preferIPv4Stack=true',
        '-Dcom.sun.management.jmxremote',
        '-Dcom.sun.management.jmxremote.port=9999',
        '-Dcom.sun.management.jmxremote.rmi.port=9998',
        '-Dcom.sun.management.jmxremote.ssl=false',
        '-Dcom.sun.management.jmxremote.authenticate=false'
      ].join(' '),
    ebTomcatMaxHeapSize: '1024m',
    ebTomcatMinHeapSize: '1024m',
    ebTomcatPermSize: '128m',
    ebRollingUpdate: true,
    dynamoPartitionKey: 'testPartitionKey',
    dynamoTableName: 'testTable',
    lambdaTimeoutSeconds: Duration.seconds(10),
    rdsDatabaseName: 'Test',
    rdsDatabasePort: 3306,
    rdsInstances: 1,
    rdsInstanceClass: InstanceClass.T2,
    rdsInstanceSize: InstanceSize.MICRO,
    sgIngressWhitelist: ['216.9.28.196/32', '10.0.0.0/16'],
    sgEgressWhitelist: ['216.9.28.196/32'],
    sshWhitelist: ['216.9.28.196/32'],
    sslCertificateArn: '',
    vpcMaxAvailabilityZones: 1,
};