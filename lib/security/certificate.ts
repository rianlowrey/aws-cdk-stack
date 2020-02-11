import { DnsValidatedCertificate } from '@aws-cdk/aws-certificatemanager';
import { IHostedZone } from '@aws-cdk/aws-route53';
import { CfnOutput, Construct } from '@aws-cdk/core';
import { Config } from '../config';

export interface CertificateParameters {
  config: Config,
  scope: Construct,
  zone: IHostedZone,
}

export class CertificateResource {
  public readonly certificate: DnsValidatedCertificate;
  public readonly outputs: CfnOutput[];

  constructor(args: CertificateParameters) {
    this.outputs = new Array<CfnOutput>();
    this.certificate = new DnsValidatedCertificate(args.scope, 'SiteCertificate', {
      domainName: `*.${args.config.domainName}`,
      hostedZone: args.zone,
    });
    this.outputs.push(new CfnOutput(args.scope, `${args.config.prefix}SSLCertificateArn`, {
      value: this.certificate.certificateArn
    }));
  }
}
