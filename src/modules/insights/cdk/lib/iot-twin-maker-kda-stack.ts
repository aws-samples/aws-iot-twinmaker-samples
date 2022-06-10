// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2021
// SPDX-License-Identifier: Apache-2.0

import {App, Fn, Stack, StackProps, CfnOutput} from 'aws-cdk-lib'
import { aws_iam as iam } from 'aws-cdk-lib';
import { aws_logs as logs } from 'aws-cdk-lib';
import { aws_kinesisanalytics as kda } from 'aws-cdk-lib';
import { aws_glue as glue } from 'aws-cdk-lib';
import { aws_s3 as s3 } from 'aws-cdk-lib';

export class IotTwinMakerKdaStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    const stack = Stack.of(this);
    const stackName = stack.stackName;
    const region = stack.region;
    const accountId = stack.account;

    const glueDatabase = new glue.CfnDatabase(this, "glueDatabase", {
      catalogId: Fn.ref("AWS::AccountId"),
      databaseInput: {
        description: "My glue database"
      }
    });

    const logGroup = new logs.LogGroup(this, `kda-flink-LogGroup`, {
      retention: logs.RetentionDays.INFINITE,
    });

    const logStream = new logs.LogStream(this, `kda-clink-LogStream`, {
      logGroup: logGroup,
    });

    const serviceExecutionRole = new iam.CfnRole(this, "serviceExecutionRole", {
      assumeRolePolicyDocument: {
            "Version": "2012-10-17",
                "Statement": [{
                "Sid": "",
                "Effect": "Allow",
                "Principal": {
                    "Service": "kinesisanalytics.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            },
            {
                "Effect": "Allow",
                "Principal": {
                "Service": "iottwinmaker.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            },
        ]
      },
      path: "/",
      managedPolicyArns: [
        "arn:aws:iam::aws:policy/CloudWatchFullAccess",
        "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess"
      ],
      policies: [
        {
          policyName: "data-access",
          policyDocument: {
            "Version": "2012-10-17",
            "Statement": [
              {
                "Effect": "Allow",
                "Resource": ["*"],
                "Action": [
                  "glue:*",
                  "s3:*",
                  "iotsitewise:*",
                  "sts:*",
                  "kinesisanalyticsv2:*",
                  "kinesisanalytics:*",
                  "iottwinmaker:*",
                  "sagemaker:*",
                ]
              }
            ]
          }
        }
      ]
    });

    const zeppelinRole = iam.Role.fromRoleArn(this, 'zeppelinRole', serviceExecutionRole.attrArn);
    const zeppelinAppName = stackName;
    const zeppelinBucket = new s3.Bucket(this, 'zeppelinBucket', {
      accessControl: s3.BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
      bucketName: `${zeppelinAppName.toLowerCase()}-${accountId}-${region}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });
    const zeppelinApplication = new kda.CfnApplicationV2(this, zeppelinAppName, {
      applicationName: zeppelinAppName,
      applicationMode: "INTERACTIVE",
      runtimeEnvironment: "ZEPPELIN-FLINK-2_0",
      serviceExecutionRole: zeppelinRole.roleArn,
      applicationConfiguration: {
        flinkApplicationConfiguration: {
          parallelismConfiguration: {
            parallelism: 4,
            configurationType: "CUSTOM"
          },
          monitoringConfiguration: {
            configurationType: "CUSTOM",
            metricsLevel: 'APPLICATION',
            logLevel: "INFO"
          }
        },
        zeppelinApplicationConfiguration: {
          catalogConfiguration: {
            glueDataCatalogConfiguration: {
              databaseArn: Fn.sub(`arn:aws:glue:\${AWS::Region}:\${AWS::AccountId}:database/\${${glueDatabase.logicalId}}`)
            }
          },
          monitoringConfiguration: {
            logLevel: "INFO"
          },
          customArtifactsConfiguration: [
            {
              artifactType: "DEPENDENCY_JAR",
              mavenReference: {
                groupId: "org.apache.flink",
                artifactId: "flink-sql-connector-kinesis_2.12",
                version: "1.13.2"
              }
            },
            {
              artifactType: "DEPENDENCY_JAR",
              mavenReference: {
                groupId: "software.amazon.msk",
                artifactId: "aws-msk-iam-auth",
                version: "1.1.0"
              }
            },
            {
              artifactType: "DEPENDENCY_JAR",
              mavenReference: {
                groupId: "org.apache.flink",
                artifactId: "flink-connector-kafka_2.12",
                version: "1.13.2"
              }
            },
            {
              artifactType: "DEPENDENCY_JAR",
              s3ContentLocation: {
                bucketArn: 'arn:aws:s3:::aws-iot-twinmaker-flink-downloads-us-east-1',
                fileKey: 'aws-iot-twinmaker-flink-1.13.1.jar'
              }
            }
          ],
          deployAsApplicationConfiguration: {
            s3ContentLocation: {
              bucketArn: zeppelinBucket.bucketArn,
              basePath: 'deployAsApp'
            }
          }
        }
      }
    });

    const kdaLogGroup = new kda.CfnApplicationCloudWatchLoggingOptionV2(
        this,
        `${zeppelinAppName}LoggingOptionId`,
        {
          applicationName: zeppelinAppName,
          cloudWatchLoggingOption: {
            logStreamArn: `arn:aws:logs:${region}:${accountId}:log-group:${logGroup.logGroupName}:log-stream:${logStream.logStreamName}`
          }
        }
    );
    kdaLogGroup.node.addDependency(zeppelinApplication)

    new CfnOutput(this, "ZeppelinAppName", {
      value: zeppelinAppName,
    });
  }
}
