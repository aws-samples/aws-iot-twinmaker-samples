import { Stack } from 'aws-cdk-lib';
import { NagSuppressions } from 'cdk-nag';

export function applySuppressions(stack: Stack): void {
  NagSuppressions.addStackSuppressions(stack, [
    {
      id: 'AwsSolutions-ECS4',
      reason: 'Suppressing cloudwatch container insights for demo purposes',
    },
    {
      id: 'AwsSolutions-VPC7',
      reason: 'Suppressing VPC logs for demo purposes',
    },
    {
      id: 'AwsSolutions-IAM4',
      reason: 'Suppressing managed policlies message for demo purposes',
    },
    {
      id: 'AwsSolutions-IAM5',
      reason: 'Suppressing resource wildcard message for demo purposes',
    },
    {
      id: 'AwsSolutions-ELB2',
      reason: 'Suppressing access logs message on ELB for demo purposes',
    },
    {
      id: 'AwsSolutions-EC23',
      reason: 'Suppressing inbound rule for 0.0.0.0 to support demo to public audience',
    },    
    {
      id: 'AwsSolutions-CFR3',
      reason: 'Suppressing cloudfront access logs for demo purposes',
    },
    {
      id: 'AwsSolutions-CFR4',
      reason: 'Suppressing cloudfront ssl support method for demo purposes',
    },
    {
      id: 'AwsSolutions-CFR5',
      reason: 'Suppressing cloudfront protocols for demo purposes',
    },
    {
      id: 'AwsSolutions-S10',
      reason: 'Bucket access is blocked and only allowed via cloudfront using https',
    },
  ]);
}
