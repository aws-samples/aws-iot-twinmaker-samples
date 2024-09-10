
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2021
// SPDX-License-Identifier: Apache-2.0

import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as path from 'path';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cloudfront_origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as nagsuppressions_stack from './nagsuppressions';
import { CfnOutput } from "aws-cdk-lib/core";
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { OriginAccessIdentity } from 'aws-cdk-lib/aws-cloudfront';

export interface ChainLitProps  extends cdk.StackProps{
  stack_name: string;
}

export class ChainlitStack extends cdk.Stack {

  constructor(scope: Construct, id: string, props: ChainLitProps) {
    super(scope, id, props);

    nagsuppressions_stack.applySuppressions(this);

    const secretName = this.node.tryGetContext("secretName");
    const companyAssetsBucketName = this.node.tryGetContext("companyAssetsBucketName");
    const originAccessIdentityId = this.node.tryGetContext("originAccessIdentityId")


    const secret = secretsmanager.Secret.fromSecretNameV2(this, 'ImportedSecret', secretName);
    const bucket = s3.Bucket.fromBucketName(this, 'ImportedBucket', companyAssetsBucketName);
    const OID = OriginAccessIdentity.fromOriginAccessIdentityId(this, "ImportedoriginAccessIdentity", originAccessIdentityId)


    // Create ECS cluster
    const cluster = new ecs.Cluster(this, `${props.stack_name}ChainlitCluster`);

    // Build the Docker image 
    const image = ecs.ContainerImage.fromAsset(path.join(__dirname, '..', '..', '..', 'assistant'));

    const taskExecutionRole = new iam.Role(this, `${props.stack_name}ChainlitTaskRole`, {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),  // Required for ECS tasks
    });

    secret.grantRead(taskExecutionRole);

    // Create the IAM Policy for Bedrock
    const bedrockPolicy = new iam.PolicyStatement({
      actions: 
      [
        'bedrock:InvokeAgent',
        'bedrock:InvokeModel',
        'bedrock:InvokeModelWithResponseStream',
        'bedrock:ListFoundationModels'
      ],
      resources: ['*']
    }); 

    taskExecutionRole.addToPolicy(bedrockPolicy);

    // Create the IAM Policy
    const iotTwinMakerPolicy = new iam.PolicyStatement({
      actions: [
        'iottwinmaker:ExecuteQuery',
        'iottwinmaker:GetPropertyValueHistory',
        "iottwinmaker:GetComponentType"
      ],
      resources: ['*']
    }); 

    taskExecutionRole.addToPolicy(iotTwinMakerPolicy);

    // Task definition for running Chainlit container
    const taskDefinition = new ecs.FargateTaskDefinition(this, `${props.stack_name}ChainlitTaskDefinition`, {
      taskRole: taskExecutionRole
    });

    const container = taskDefinition.addContainer(`${props.stack_name}ChainlitApp`, { 
      image,
      memoryLimitMiB: 512,
      portMappings: [{ containerPort: 8000 }],
      logging: new ecs.AwsLogDriver({streamPrefix: "ChainlitApp" })
    });

    // Create an ECS Fargate service
    const service = new ecs.FargateService(this, `${props.stack_name}ChainlitService`, {
      cluster,
      taskDefinition,
      assignPublicIp: true
    }); 

    // Create the Load Balancer
    const loadBalancer = new elbv2.ApplicationLoadBalancer(this, `${props.stack_name}ALB`, {
      vpc: service.cluster.vpc, // Your VPC
      internetFacing: true 
    });

    // Add Listener
    const listener = loadBalancer.addListener('PublicListener', { port: 80 });

    // Add your Fargate service as the target
    listener.addTargets('ECS', {
      port: 8000, 
      targets: [service] 
    });
    
  
    const chainlitorigin = new cloudfront_origins.HttpOrigin(loadBalancer.loadBalancerDnsName, {
        protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY
    });

    // Create Origin for S3
    const s3origin = new cloudfront_origins.S3Origin(bucket, {
      originAccessIdentity: OID
    });

    // Create CloudFront Distribution
    const distribution = new cloudfront.Distribution(this, `${props.stack_name}ChainlitDistribution`, {
     defaultBehavior: { 
       origin: chainlitorigin,
       cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
       viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
       allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
       originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
     },
     additionalBehaviors: {
      '/docs/*': { origin: s3origin } 
     }
    });

    new CfnOutput(this, "ChainlitURL", {
        value: `https://${distribution.distributionDomainName}`,
    });

  }
}
