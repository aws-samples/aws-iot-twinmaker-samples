// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as path from "path";
import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib'
import { Construct } from 'constructs';
import { aws_iam as iam } from 'aws-cdk-lib';
import { aws_sagemaker as aws_sm } from 'aws-cdk-lib';
import { aws_s3_assets as assets } from 'aws-cdk-lib';
import { aws_ecr_assets as ecr_a } from 'aws-cdk-lib';
import { SimulationType } from "./utils";

interface IotTwinMakerSageMakerStackProps extends StackProps {
  /**
   * simulation type
   */
  readonly simulationType: SimulationType;
}

export class IotTwinMakerSagemakerStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: IotTwinMakerSageMakerStackProps
  ) {
    super(scope, id, props);

    const CDK_DIR = path.join(__dirname, "..");

    const SIMULATION_ASSETS_DIR = path.join(
      CDK_DIR,
      `assets/${props.simulationType}/models`
    );
    const ANOMALY_DETECTION_ASSETS_DIR = path.join(
      CDK_DIR,
      `assets/anomaly_detection`
    );

    /***********************************************************************
     * Assets
     ***********************************************************************/
    const simulationModelAsset = new assets.Asset(
      this,
      "MapleSoftSimulationModelRuntimeAsset",
      {
        path: path.join(SIMULATION_ASSETS_DIR, "Mixer.tar.gz"),
      }
    );
    const anomalyDetectionModelAsset = new assets.Asset(
      this,
      "AnomalyDetectionModelRuntimeAsset",
      {
        path: path.join(ANOMALY_DETECTION_ASSETS_DIR, "ad_model.tar.gz"),
      }
    );

    /***********************************************************************
     *  ECR resources
     ***********************************************************************/
    const dockerImageAsset = new ecr_a.DockerImageAsset(this, "BuildImage", {
      directory: path.join(CDK_DIR, `assets/${props.simulationType}/`),
    });

    /***********************************************************************
     * Sagemaker resources
     ***********************************************************************/
    const executionRole = new iam.Role(this, "SageMakerExecutionRole", {
      assumedBy: new iam.ServicePrincipal("sagemaker.amazonaws.com"),
      inlinePolicies: {
        executionPolicies: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                "cloudwatch:PutMetricData",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
                "logs:CreateLogGroup",
                "logs:DescribeLogStreams",
              ],
              resources: ["*"],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                "ecr:GetAuthorizationToken",
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetDownloadUrlForLayer",
                "ecr:BatchGetImage",
              ],
              resources: ["*"],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket",
              ],
              resources: ["*"],
            }),
          ],
        }),
      },
    });
    executionRole.addManagedPolicy({
      managedPolicyArn: "arn:aws:iam::aws:policy/AmazonSageMakerFullAccess",
    });

    /***********************************************************************
     * Create Sagemaker endpoints
     ***********************************************************************/
    const simulationEndpoint = this.createSimulationEndpoint(
      props,
      executionRole,
      dockerImageAsset,
      simulationModelAsset
    );
    const anomalyDetectionEndpoint = this.createAnomalyDetectionEndpoint(
      executionRole,
      anomalyDetectionModelAsset,
      props.env?.region as string
    );

    new CfnOutput(this, "SimulationEndpointName", {
      value: simulationEndpoint.attrEndpointName,
    });
    new CfnOutput(this, "AnomalyDetectionEndpointName", {
      value: anomalyDetectionEndpoint.attrEndpointName,
    });
  }

  private createSimulationEndpoint(
    props: IotTwinMakerSageMakerStackProps,
    executionRole: iam.Role,
    dockerImageAsset: ecr_a.DockerImageAsset,
    simulationModelAsset: assets.Asset
  ): aws_sm.CfnEndpoint {
    const sageMakerSimulationModel = new aws_sm.CfnModel(
      this,
      "SageMakerSimulationModel",
      {
        executionRoleArn: executionRole.roleArn,
        modelName: `${props.simulationType}-Model-${new Date().valueOf()}`,
        containers: [
          {
            image: dockerImageAsset.imageUri,
            mode: "SingleModel",
            modelDataUrl: simulationModelAsset.httpUrl,
          },
        ],
      }
    );
    sageMakerSimulationModel.node.addDependency(
      dockerImageAsset,
      simulationModelAsset,
      executionRole
    );

    const simulationEndpointConfig = new aws_sm.CfnEndpointConfig(
      this,
      "SagemakerSimulationEndpointConfig",
      {
        productionVariants: [
          {
            initialInstanceCount: 1.0,
            initialVariantWeight: 1.0,
            instanceType: "ml.m4.xlarge",
            modelName: sageMakerSimulationModel.modelName!,
            variantName: "AllTraffic", // keep variant name constant
          },
        ],
      }
    );
    simulationEndpointConfig.node.addDependency(sageMakerSimulationModel);

    const simulationEndpoint = new aws_sm.CfnEndpoint(this, "SimulationEndpoint", {
      endpointConfigName: simulationEndpointConfig.attrEndpointConfigName!,
    });
    simulationEndpoint.node.addDependency(simulationEndpointConfig);
    return simulationEndpoint;
  }

  private createAnomalyDetectionEndpoint(
    executionRole: iam.Role,
    anomalyDetectionModelAsset: assets.Asset,
    region: string
  ): aws_sm.CfnEndpoint {
    const sageMakerModel = new aws_sm.CfnModel(
      this,
      "SageMakerAnomalyDetectionModel",
      {
        executionRoleArn: executionRole.roleArn,
        modelName: `Anomaly-Detection-Model-${new Date().valueOf()}`,
        containers: [
          {
            image: IotTwinMakerSagemakerStack.getRandomCutForestDockerRegistrationPath(region),
            imageConfig: { repositoryAccessMode: "Platform" },
            mode: "SingleModel",
            modelDataUrl: anomalyDetectionModelAsset.httpUrl,
          },
        ],
      }
    );
    sageMakerModel.node.addDependency(
      anomalyDetectionModelAsset,
      executionRole
    );

    const sageMakerEndpointConfig = new aws_sm.CfnEndpointConfig(
      this,
      "SagemakerAnomalyDetectionEndpointConfig",
      {
        productionVariants: [
          {
            initialInstanceCount: 1.0,
            initialVariantWeight: 1.0,
            instanceType: "ml.m4.xlarge",
            modelName: sageMakerModel.modelName!,
            variantName: "AllTraffic", // keep variant name constant
          },
        ],
      }
    );
    sageMakerEndpointConfig.node.addDependency(sageMakerModel);

    const sageMakerEndpoint = new aws_sm.CfnEndpoint(
      this,
      "AnomalyDetectionEndpoint",
      {
        endpointConfigName: sageMakerEndpointConfig.attrEndpointConfigName!,
      }
    );
    sageMakerEndpoint.node.addDependency(sageMakerEndpointConfig);
    return sageMakerEndpoint;
  }

  private static getRandomCutForestDockerRegistrationPath(region: string): string {
    switch (region) {
      case "us-east-1":
        return "382416733822.dkr.ecr.us-east-1.amazonaws.com/randomcutforest:1";
      case "us-west-2":
        return "174872318107.dkr.ecr.us-west-2.amazonaws.com/randomcutforest:1";
      case "eu-west-1":
        return "438346466558.dkr.ecr.eu-west-1.amazonaws.com/randomcutforest:1";
      case "ap-southeast-1":
        return "475088953585.dkr.ecr.ap-southeast-1.amazonaws.com/randomcutforest:1";
      case "eu-central-1":
        return "664544806723.dkr.ecr.eu-central-1.amazonaws.com/randomcutforest:1";
      case "ap-southeast-2":
        return "712309505854.dkr.ecr.ap-southeast-2.amazonaws.com/randomcutforest:1";
      default:
        throw new Error(`AWS region ${region} not supported by this demo.`);
    }
  }
}
