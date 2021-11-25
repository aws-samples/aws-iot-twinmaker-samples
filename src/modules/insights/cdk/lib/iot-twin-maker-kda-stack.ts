// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2021
// SPDX-License-Identifier: Apache-2.0

import * as cdk from '@aws-cdk/core';
import * as kda from "@aws-cdk/aws-kinesisanalytics";
import * as glue from "@aws-cdk/aws-glue";
import * as iam from "@aws-cdk/aws-iam";
import * as assets from "@aws-cdk/aws-s3-assets";
import {CfnParameter, CustomResource} from "@aws-cdk/core";
import * as path from 'path';

export class IotTwinMakerKdaStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const stack = cdk.Stack.of(this);
    const stackName = stack.stackName;
    const region = stack.region;
    const accountId = stack.account;

    const glueDatabase = new glue.CfnDatabase(this, "glueDatabase", {
      catalogId: cdk.Fn.ref("AWS::AccountId"),
      databaseInput: {
        description: "My glue database"
      }
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

    const awsIotTwinMakerFlinkConnector = new assets.Asset(this, "iotTwinMakerFlinkLibraryAsset", {
      path: path.join(path.dirname(path.basename(__dirname)), 'assets/aws-iot-twinmaker-flink-1.13.0.jar')
    });

    const zeppelinAppName = `ZeppelinGettingStartedApp-${this.stackName}`
    const zeppelinApplication = new kda.CfnApplicationV2(this, "zeppelinApplication", {
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
              databaseArn: cdk.Fn.sub(`arn:aws:glue:\${AWS::Region}:\${AWS::AccountId}:database/\${${glueDatabase.logicalId}}`)
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
                bucketArn: awsIotTwinMakerFlinkConnector.bucket.bucketArn,
                fileKey: awsIotTwinMakerFlinkConnector.s3ObjectKey
              }
            }
          ]
        }
      }
    });

    new cdk.CfnOutput(this, "ZeppelinAppName", {
      value: zeppelinAppName,
    });
    //
    // new cdk.CfnOutput(this, "ZeppelinNotebook", {
    //   description: 'TwinMaker Zeppelin Notebook',
    //   value: cdk.Fn.sub(`https://\${AWS::Region}.console.aws.amazon.com/kinesisanalytics/home?region=\${AWS::Region}#/notebook/\${zepAppName}/details/configuration`, {
    //     "zepAppName": cdk.Fn.ref(zeppelinApplication.logicalId)
    //   })
    // });
  }
}
