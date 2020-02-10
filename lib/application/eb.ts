import { IVpc, SecurityGroup, BastionHostLinux } from '@aws-cdk/aws-ec2';
import { CfnApplication, CfnConfigurationTemplate, CfnEnvironment } from '@aws-cdk/aws-elasticbeanstalk';
import { CfnInstanceProfile, Effect, Policy, PolicyStatement, Role, ServicePrincipal, ManagedPolicy } from '@aws-cdk/aws-iam';
import { Construct } from '@aws-cdk/core';
import { Config } from '../config';
import { BastionResource } from '../security/bastion';

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
        value: args.config.ebAutoScaleMinInstanceCount,
      }, {
        namespace: 'aws:autoscaling:asg',
        optionName: 'MaxSize',
        value: args.config.ebAutoScaleMaxInstanceCount,
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
        value: args.config.ebRollingUpdate,
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
        value: args.config.ebAutoScaleCpuUpperThreshold,
      }, {
        namespace: 'aws:autoscaling:trigger',
        optionName: 'LowerThreshold',
        value: args.config.ebAutoScaleCpuLowerThreshold,
      }, {
        namespace: 'aws:autoscaling:trigger',
        optionName: 'LowerThreshold',
        value: args.config.ebAutoScaleCpuLowerThreshold,
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
        namespace: 'aws:elbv2:listener:default',
        optionName: 'ListenerEnabled',
        value: !args.config.ssl
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
        namespace: 'aws:ec2:vpc',
        optionName: 'ELBScheme',
        value: 'internal',
      }
    ];

    this.configurationTemplate = new CfnConfigurationTemplate(args.scope, `${args.config.prefix}ElasticBeanstalkConfigurationTemplate`, {
      applicationName: args.config.ebApplicationName,
      optionSettings: 
      solutionStackName: undefined,
      sourceConfiguration:  undefined
    })


  }
}

export class EbResource {
  public readonly application: CfnApplication;
  public readonly environment: CfnEnvironment;


  constructor(args: EbParameters) {
    this.application = new CfnApplication(args.scope, `${args.config.prefix}Application`, {
      applicationName: args.config.ebApplicationName,
    });

    this.environment = new CfnEnvironment(args.scope, `${args.config.prefix}Environment`, {
      environmentName: args.config.ebEnvironmentName,
      applicationName: args.config.ebApplicationName,
      platformArn: args.config.ebPlatformArn,
    });



    this.role.attachInlinePolicy(this.policy);

    this.instanceProfile = new CfnInstanceProfile(args.scope, `${args.config.prefix}ElasticBeanstalkProfile`, {
      roles: [this.role.roleName]
    });
  }
}
