import { AuthorizationType, LambdaRestApi } from '@aws-cdk/aws-apigateway';
import { IVpc } from '@aws-cdk/aws-ec2';
import * as lambda from '@aws-cdk/aws-lambda';
import { Construct } from '@aws-cdk/core';
import { Config } from '../config';
import { Role, Policy, CfnInstanceProfile, ServicePrincipal, ManagedPolicy, PolicyStatement, Effect } from '@aws-cdk/aws-iam';

export interface ApiGwParameters {
    config: Config;
    scope: Construct;
    vpc: IVpc
}

export class ApiGwResource {
    public readonly role: Role;
    public readonly policy: Policy;
    public readonly instanceProfile: CfnInstanceProfile;

    constructor(args: ApiGwParameters) {
        const requestHandler = new lambda.Function(args.scope, `${args.config.prefix}.ApiRequestHandler`, {
            code: lambda.Code.asset('resources'),
            handler: 'request.handler',
            runtime: lambda.Runtime.NODEJS_12_X,
            timeout: args.config.lambdaTimeout,
            vpc: args.vpc
        });

        const api = new LambdaRestApi(args.scope, 'Api', {
            handler: requestHandler,
            options: {
                description: 'LambdaRestApi Description',
                restApiName: 'LambdaRestApi',
            },
            proxy: false,
        });

        api.root.addMethod('ANY', undefined, {
            authorizationType: AuthorizationType.IAM,
        });

        api.root.addResource('{proxy+}').addMethod('ANY', undefined, {
            authorizationType: AuthorizationType.IAM,
        });

        this.role = new Role(args.scope, `${args.config.prefix}ApiGatewayRole`, {
            assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
            managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonEC2RoleforSSM')],
          });
      
          this.policy = new Policy(args.scope, `${args.config.prefix}ApiGatewayPolicy`, {
            policyName: `${args.config.prefix}ApiGatewayPolicy`,
          });
      
          this.policy.addStatements(new PolicyStatement({
            actions: ['ssm:CreateOpsItem'],
            effect: Effect.ALLOW,
            resources: ['*'],
          }));
      
          this.role.attachInlinePolicy(this.policy);
      
          this.instanceProfile = new CfnInstanceProfile(args.scope, `${args.config.prefix}ApiGatewayProfile`, {
            roles: [this.role.roleName]
          });
    }
}
