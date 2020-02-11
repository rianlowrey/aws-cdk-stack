import { CfnElement, CfnOutput, CfnOutputProps, Construct, Stack, StackProps } from '@aws-cdk/core';

export class CustomCfnOutput extends CfnOutput {
  public constructor(scope: Construct, id: string, props: CfnOutputProps) {
    super(scope, id, props);
    this.overrideLogicalId(id);
  }
}

export class CustomStack extends Stack {
  public readonly logicalId: string;

  public constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    this.logicalId = id;
  }

  public allocateLogicalId(cfnElement: CfnElement): string {
    return this.logicalId;
  }
}