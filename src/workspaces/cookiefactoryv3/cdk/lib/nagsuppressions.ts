import { Stack } from 'aws-cdk-lib';
import { NagSuppressions } from 'cdk-nag';

export function applySuppressions(stack: Stack): void {
  NagSuppressions.addStackSuppressions(stack, [
    {
      id: 'AwsSolutions-COG2',
      reason: 'MFA not required for demo purposes',
    },
    {
      id: 'AwsSolutions-COG3',
      reason: 'AdvancedSecurityMode not enforced for demo purposes',
    },
    {
      id: 'AwsSolutions-IAM5',
      reason: 'Suppressing wildcard permissions for demo purposes',
      appliesTo: [
        'Resource::arn:aws:iottwinmaker:us-east-1:965637542341:workspace/CookieFactory/*',
        'Resource::arn:aws:iottwinmaker:us-east-1:965637542341:workspace/*',
        'Resource::arn:aws:s3:::twinmaker-cfv3-us-east-1-965637542341-cookiefactory/*',
        'Action::s3:GetObject*',
        'Action::s3:GetBucket*',
        'Action::s3:List*',
        'Action::s3:DeleteObject*',
        'Action::s3:Abort*',
        'Resource::arn:<CookiefactoryAssetsBucket416149A8.Arn>/*',
        'Resource::*'
      ],
    },
    {
      id: 'AwsSolutions-S1',
      reason: 'Suppressing S3 access logs for demo purposes',
    },
    {
      id: 'AwsSolutions-S10',
      reason: 'Suppressing SSL requirement for S3 bucket for demo purposes',
    },
    {
      id: 'AwsSolutions-IAM4',
      reason: 'Suppressing AWS managed policies message for demo purposes',
      appliesTo: [
        'Policy::arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
        'Policy::arn:<AWS::Partition>:iam::aws:policy/AmazonTimestreamReadOnlyAccess',
      ],
    },
    {
      id: 'AwsSolutions-L1',
      reason: 'Suppressing non-container Lambda runtime version for demo purposes',
    },
    {
      id: 'AwsSolutions-CFR3',
      reason: 'Suppressing CloudFront access logs for demo purposes',
    },
    {
      id: 'AwsSolutions-CFR4',
      reason: 'Suppressing SSLv3/TLSv1 warning for demo purposes',
    },
    {
      id: 'AwsSolutions-SMG4',
      reason: 'Automatic rotation of secrets not required for demo purposes',
    },
    {
        id: 'AwsSolutions-IAM4',
        reason: 'Suppressing AWS managed policies for demo purposes',
        appliesTo: [
          'Policy::arn:<AWS::Partition>:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
        ],
      },
      {
        id: 'AwsSolutions-IAM5',
        reason: 'Suppressing wildcard permissions for demo purposes',
        appliesTo: [
          'Resource::arn:<AWS::Partition>:s3:::cdk-hnb659fds-assets-965637542341-us-east-1/*',
          'Resource::<CookiefactoryAssetsBucket416149A8.Arn>/*',
        ],
      },
      {
        id: 'AwsSolutions-CFR1',
        reason: 'Geo restrictions are not required for the demo application.',
      },
      {
        id: 'AwsSolutions-CFR2',
        reason: 'AWS WAF integration is not required for this demo application.',
      },
      {
        id: 'AwsSolutions-TS3',
        reason: 'Timestream KMS key encryption is not required for the demo application.',
      },
      {
        id: 'AwsSolutions-IAM4',
        reason: 'Suppressing AWS managed policies for demo purposes',
        appliesTo: [
          'Policy::arn:<AWS::Partition>:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
        ],
      }
  ]);
}
