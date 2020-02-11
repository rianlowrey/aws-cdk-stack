import { BastionHostLinux, IVpc, SecurityGroup } from '@aws-cdk/aws-ec2';
import { CfnApplication, CfnApplicationVersion, CfnConfigurationTemplate, CfnEnvironment } from '@aws-cdk/aws-elasticbeanstalk';
import { CfnInstanceProfile, Effect, ManagedPolicy, Policy, PolicyStatement, Role, ServicePrincipal } from '@aws-cdk/aws-iam';
import { CfnOutput, Construct } from '@aws-cdk/core';
import { Config } from '../config';
import { CustomCfnOutput } from '../custom';

export interface EbParameters {
  bastion: BastionHostLinux,
  config: Config,
  bastionSecurityGroup: SecurityGroup,
  elbSecurityGroup: SecurityGroup,
  scope: Construct,
  vpc: IVpc,
}

export class EbConfigurationTemplateResource {
  public readonly serviceRole: Role;
  public readonly applicationRole: Role;
  public readonly role: Role;
  public readonly policy: Policy;
  public readonly instanceProfile: CfnInstanceProfile;
  public readonly configurationTemplate: CfnConfigurationTemplate;

  constructor(args: EbParameters) {
    this.serviceRole = new Role(args.scope, `${args.config.prefix}ElasticBeanstalkRole`, {
      assumedBy: new ServicePrincipal('elasticbeanstalk.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSElasticBeanstalkEnhancedHealth'),
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSElasticBeanstalkService')
      ],
    });

    this.policy = new Policy(args.scope, `${args.config.prefix}ElasticBeanstalkPolicy`, {
      policyName: `${args.config.prefix}ElasticBeanstalkPolicy`,
      roles: [this.role]
    });

    this.policy.addStatements(new PolicyStatement({
      actions: ['*'],
      effect: Effect.ALLOW,
      resources: ['*'],
    }));

    const optionSettings: CfnConfigurationTemplate.ConfigurationOptionSettingProperty[] = [{
      namespace: 'aws:elasticbeanstalk:environment',
      optionName: 'EnvironmentType',
      value: 'LoadBalanced',
    }, {
      namespace: 'aws:elasticbeanstalk:environment',
      optionName: 'LoadBalancerType',
      value: 'application',
    }, {
      namespace: 'aws:elasticbeanstalk:environment',
      optionName: 'ServiceRole',
      value: this.serviceRole.roleId,
    }, {
      namespace: 'aws:autoscaling:asg',
      optionName: 'MinSize',
      value: args.config.ebAutoScaleMinInstanceCount.toString(),
    }, {
      namespace: 'aws:autoscaling:asg',
      optionName: 'MaxSize',
      value: args.config.ebAutoScaleMaxInstanceCount.toString(),
    }, {
      namespace: 'aws:autoscaling:launchconfiguration',
      optionName: 'ImageId',
      value: args.config.ami,
    }, {
      namespace: 'aws:autoscaling:launchconfiguration',
      optionName: 'SecurityGroups',
      value: args.bastionSecurityGroup.securityGroupId,
    }, {
      namespace: 'aws:autoscaling:launchconfiguration',
      optionName: 'SSHSourceRestriction',
      value: 'tcp, 22, 22,' + args.bastion.instanceId,
    }, {
      namespace: 'aws:autoscaling:launchconfiguration',
      optionName: 'InstanceType',
      value: args.config.ebInstanceClass + '.' + args.config.ebInstanceSize,
    }, {
      namespace: 'aws:autoscaling:launchconfiguration',
      optionName: 'IamInstanceProfile',
      value: this.instanceProfile.instanceProfileName,
    }, {
      namespace: 'aws:autoscaling:launchconfiguration',
      optionName: 'EC2KeyName',
      value: '',
    }, {
      namespace: 'aws:autoscaling:updatepolicy:rollingupdate',
      optionName: 'RollingUpdateEnabled',
      value: args.config.ebRollingUpdate ? 'true' : 'false',
    }, {
      namespace: 'aws:autoscaling:updatepolicy:rollingupdate',
      optionName: 'RollingUpdateType',
      value: 'Health',
    }, {
      namespace: 'aws:autoscaling:trigger',
      optionName: 'MeasureName',
      value: 'CPUUtilization',
    }, {
      namespace: 'aws:autoscaling:trigger',
      optionName: 'Unit',
      value: 'Percent',
    }, {
      namespace: 'aws:autoscaling:trigger',
      optionName: 'UpperThreshold',
      value: args.config.ebAutoScaleCpuUpperThreshold.toString(),
    }, {
      namespace: 'aws:autoscaling:trigger',
      optionName: 'LowerThreshold',
      value: args.config.ebAutoScaleCpuLowerThreshold.toString(),
    }, {
      namespace: 'aws:ec2:vpc',
      optionName: 'VPCId',
      value: args.vpc.vpcId,
    }, {
      namespace: 'aws:ec2:vpc',
      optionName: 'Subnets',
      value: args.vpc.privateSubnets.map(subnet => subnet.subnetId).join(','),
    }, {
      namespace: 'aws:ec2:vpc',
      optionName: 'ELBSubnets',
      value: args.vpc.privateSubnets.map(subnet => subnet.subnetId).join(','),
    }, {
      namespace: 'aws:ec2:vpc',
      optionName: 'ELBScheme',
      value: 'public',
    }, {
      namespace: 'aws:ec2:vpc',
      optionName: 'AssociatePublicIpAddress',
      value: 'false',
    }, {
      namespace: 'aws:elbv2:listener:default',
      optionName: 'ListenerEnabled',
      value: args.config.ssl ? 'false' : 'true',
    }, {
      namespace: 'aws:elbv2:loadbalancer',
      optionName: 'SecurityGroups',
      value: args.elbSecurityGroup.securityGroupId
    }, {
      namespace: 'aws:elbv2:loadbalancer',
      optionName: 'ManagedSecurityGroup',
      value: args.elbSecurityGroup.securityGroupId
    }, {
      namespace: 'aws:elbv2:listenerrule:default',
      optionName: 'PathPatterns',
      value: '/*'
    }, {
      namespace: `aws:elbv2:listener:${args.config.ebElasticLoadBalancerListenPort}`,
      optionName: 'Rules',
      value: 'default'
    }, {
      namespace: `aws:elbv2:listener:${args.config.ebElasticLoadBalancerListenPort}`,
      optionName: 'SSLCertificateArns',
      value: args.config.sslCertificateArn,
    }, {
      namespace: 'aws:elasticbeanstalk:cloudwatch:logs',
      optionName: 'StreamLogs',
      value: 'true',
    }, {
      namespace: 'aws:elasticbeanstalk:cloudwatch:logs',
      optionName: 'DeleteOnTerminate',
      value: 'true',
    }, {
      namespace: 'aws:elasticbeanstalk:container:tomcat:jvmoptions',
      optionName: 'JVM Options',
      value: args.config.ebTomcatJvmOptions
    }, {
      namespace: 'aws:elasticbeanstalk:container:tomcat:jvmoptions',
      optionName: 'XX:MaxPermSize',
      value: args.config.ebTomcatPermSize,
    }, {
      namespace: 'aws:elasticbeanstalk:container:tomcat:jvmoptions',
      optionName: 'Xms',
      value: args.config.ebTomcatMinHeapSize,
    }, {
      namespace: 'aws:elasticbeanstalk:container:tomcat:jvmoptions',
      optionName: 'Xmx',
      value: args.config.ebTomcatMaxHeapSize
    }, {
      optionName: 'LogPublicationControl',
      namespace: 'aws:elasticbeanstalk:hostmanager',
      value: 'true'
    }];

    this.configurationTemplate = new CfnConfigurationTemplate(args.scope,
      `${args.config.prefix}ElasticBeanstalkConfigurationTemplate`, {
      applicationName: args.config.ebApplicationName,
      optionSettings,
      solutionStackName: args.config.ebSolutionStackName
    });
  }
}

export class EbResource {
  public readonly application: CfnApplication;
  public readonly applicationVersion: CfnApplicationVersion;
  public readonly environment: CfnEnvironment;
  public readonly outputs: CfnOutput[];

  constructor(args: EbParameters) {
    this.outputs = new Array<CfnOutput>();

    this.application = new CfnApplication(args.scope, `${args.config.prefix}Application`, {
      applicationName: args.config.ebApplicationName,
    });

    this.applicationVersion = new CfnApplicationVersion(args.scope, `${args.config.prefix}ApplicationVersion`, {
      applicationName: this.application.applicationName,
      sourceBundle: {
        s3Bucket: pythonServiceS3BucketName,
        s3Key: pythonServiceArchiveName
      }
    });

    this.environment = new CfnEnvironment(args.scope, `${args.config.prefix}Environment`, {
      environmentName: `${args.config.prefix}${args.config.ebApplicationName}-${args.config.ebEnvironmentName}`,
      applicationName: args.config.ebApplicationName,
      platformArn: args.config.ebPlatformArn,
    });

    this.outputs.push(new CustomCfnOutput(args.scope, `${this.environment.environmentName}EndpointUrl`, {
      value: this.environment.attrEndpointUrl,
    }))
  }
}
