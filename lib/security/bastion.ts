import { BastionHostLinux, IVpc, Peer, SubnetType } from '@aws-cdk/aws-ec2';
import { Construct } from '@aws-cdk/core';
import { Config } from '../config';
import { Role, Policy, CfnInstanceProfile, ServicePrincipal, ManagedPolicy, PolicyStatement, Effect } from '@aws-cdk/aws-iam';

export interface BastionParameters {
  config: Config,
  scope: Construct,
  vpc: IVpc,
}

export class BastionResource {
  public readonly bastion: BastionHostLinux;
  public readonly role: Role;
  public readonly policy: Policy;
  public readonly instanceProfile: CfnInstanceProfile;
  
  constructor(args: BastionParameters) {
    
    this.role = new Role(args.scope, `${args.config.prefix}BastionRole`, {
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonEC2RoleforSSM')],
    });

    this.policy = new Policy(args.scope, `${args.config.prefix}BastionPolicy`, {
      policyName: `${args.config.prefix}BastionPolicy`,
    });

    this.policy.addStatements(new PolicyStatement({
      actions: ['ssm:CreateOpsItem'],
      effect: Effect.ALLOW,
      resources: ['*'],
    }));

    this.role.attachInlinePolicy(this.policy);

    this.instanceProfile = new CfnInstanceProfile(args.scope, `${args.config.prefix}BastionProfile`, {
      roles: [this.role.roleName]
    });
    
    this.bastion = new BastionHostLinux(args.scope, `${args.config.prefix}BastionHost`, {
      instanceName: `${args.config.prefix}BastionHost`,
      vpc: args.vpc,
      subnetSelection: { subnetType: SubnetType.PUBLIC },
    });

    args.config.sshWhitelist.forEach(peer => {
      this.bastion.allowSshAccessFrom(Peer.ipv4(peer));
    });
  }
}
