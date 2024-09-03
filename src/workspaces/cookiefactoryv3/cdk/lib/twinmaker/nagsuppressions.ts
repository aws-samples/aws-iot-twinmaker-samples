import { Stack } from 'aws-cdk-lib';
import { NagSuppressions } from 'cdk-nag';

export function applySuppressions(stack: Stack): void {
  NagSuppressions.addStackSuppressions(stack, [
    {
      id: 'AwsSolutions-IAM4',
      reason: 'Suppressing IAM managed role warnings. Managed roles remaining are in accordance with AWS Documentation for services used',
    },
    {
      id: 'AwsSolutions-IAM5',
      reason: 'Suppressing IAM wildcard permissions warnings. Wildcards remaining are in accordance with AWS Documentation for services used',
    },
    {
      id: 'AwsSolutions-L1',
      reason: 'Suppressing as libraries in this deployment require a specfic python runtime',
    }
  ]);
}
