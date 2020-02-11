import { Peer, Port, SecurityGroup, SubnetType, Vpc } from '@aws-cdk/aws-ec2';
import { CfnOutput, Construct } from '@aws-cdk/core';
import { Config } from '../config';
import { CustomCfnOutput } from '../custom';

export interface VpcParameters {
  config: Config,
  scope: Construct,
}

export class VpcResource {
  public readonly outputs: CfnOutput[];
  public readonly vpc: Vpc;
  public readonly vpcSecurityGroup: SecurityGroup;

  constructor(args: VpcParameters) {
    this.outputs = new Array<CfnOutput>();
    this.vpc = new Vpc(args.scope, `${args.config.prefix}Vpc`, {
      cidr: '10.0.0.0/16',
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `${args.config.prefix}Ingress`,
          subnetType: SubnetType.PUBLIC,
        },
        {
          cidrMask: 28,
          name: `${args.config.prefix}Database`,
          subnetType: SubnetType.ISOLATED,
        },
      ],
      maxAzs: args.config.vpcMaxAvailabilityZones,
      natGateways: 0,
    });

    this.vpcSecurityGroup = new SecurityGroup(args.scope, `${args.config.prefix}SecurityGroup`, {
      vpc: this.vpc,
      allowAllOutbound: false,
      securityGroupName: `${args.config.prefix}SecurityGroup`,
      description: `${args.config.prefix} Define rules for securing VPC`,
    });

    args.config.sgIngressWhitelist.forEach(ingress => {
      this.vpcSecurityGroup.addIngressRule(Peer.ipv4(ingress), Port.tcp(80));
      this.vpcSecurityGroup.addIngressRule(Peer.ipv4(ingress), Port.tcp(443));
      this.vpcSecurityGroup.addIngressRule(Peer.ipv4(ingress), Port.tcp(3306));
    });

    args.config.sgEgressWhitelist.forEach(egress => {
      this.vpcSecurityGroup.addEgressRule(Peer.ipv4(egress), Port.tcp(80));
      this.vpcSecurityGroup.addEgressRule(Peer.ipv4(egress), Port.tcp(443));
      this.vpcSecurityGroup.addEgressRule(Peer.ipv4(egress), Port.tcp(3306));
    });

    this.outputs.push(new CustomCfnOutput(args.scope, `${args.config.prefix}VpcSecurityGroupId`, {
      value: this.vpcSecurityGroup.securityGroupId,
    }))
  }
}
