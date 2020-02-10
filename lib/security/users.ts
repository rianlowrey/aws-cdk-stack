import { CfnAccessKey, IRole, IUser, PolicyStatement, Role, User } from '@aws-cdk/aws-iam';
import { CfnOutput, Construct } from '@aws-cdk/core';
import { Config } from '../config';

export interface UsersParameters {
  config: Config,
  scope: Construct,
}

export class UsersResource {

  public readonly trustedUser: IUser;
  public readonly untrustedUser: IUser;
  public readonly trustedRole: IRole;
  public readonly outputs: CfnOutput[];

  constructor(args: UsersParameters) {
    this.outputs = new Array();
    this.trustedUser = this.createTrustedUser(args);
    this.untrustedUser = this.createUntrustedUser(args);
    this.trustedRole = this.createTrustedRole(args);
  }

  private createTrustedUser(args: UsersParameters): IUser {
    const user = new User(args.scope, 'TrustedUser', {
      userName: 'trusted-user',
    });

    user.addManagedPolicy({
      managedPolicyArn: 'arn:aws:iam::aws:policy/AmazonAPIGatewayInvokeFullAccess',
    });

    const accessKey = new CfnAccessKey(args.scope, 'TrustedUserAccessKey', {
      userName: user.userName,
    });

    this.outputs.push(new CfnOutput(args.scope, 'TrustedUserAccessKeyId', {
      value: accessKey.userName,
    }));

    this.outputs.push(new CfnOutput(args.scope, 'TrustedUserSecretAccessKey', {
      value: accessKey.attrSecretAccessKey,
    }));

    return user;
  }

  private createUntrustedUser(args: UsersParameters): IUser {
    const user = new User(args.scope, 'UntrustedUser', {
      userName: 'untrusted-user',
    });

    const accessKey = new CfnAccessKey(args.scope, 'UntrustedUserAccessKey', {
      userName: user.userName,
    });

    this.outputs.push(new CfnOutput(args.scope, 'UntrustedUserAccessKeyId', {
      value: accessKey.userName,
    }));

    this.outputs.push(new CfnOutput(args.scope, 'UntrustedUserSecretAccessKey', {
      value: accessKey.attrSecretAccessKey,
    }));

    return user;
  }

  private createTrustedRole(args: UsersParameters): IRole {
    const role = new Role(args.scope, 'ApiGatewayRole', {
      assumedBy: this.untrustedUser,
      roleName: 'ApiGatewayInvoke',
    });

    role.addToPolicy(new PolicyStatement({
      actions: ['execute-api:Invoke', 'execute-api:ManageConnections'],
      resources: ['arn:aws:execute-api:*:*:*'],
    }));

    return role;
  }
}