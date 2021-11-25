// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as path from "path";
import * as cdk from "@aws-cdk/core";
import * as assets from "@aws-cdk/aws-s3-assets";
import { SimulationType } from "./utils";
import {
  CfnEndpoint,
  CfnEndpointConfig,
  CfnModel,
} from "@aws-cdk/aws-sagemaker";
import {
  Effect,
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "@aws-cdk/aws-iam";
import { DockerImageAsset } from "@aws-cdk/aws-ecr-assets";

interface IotTwinMakerSageMakerStackProps extends cdk.StackProps {
  /**
   * simulation type
   */
  readonly simulationType: SimulationType;
}

export class IotTwinMakerSagemakerStack extends cdk.Stack {
  constructor(
    scope: cdk.Construct,
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
    const dockerImageAsset = new DockerImageAsset(this, "BuildImage", {
      directory: path.join(CDK_DIR, `assets/${props.simulationType}/`),
    });

    /***********************************************************************
     * Sagemaker resources
     ***********************************************************************/
    const executionRole = new Role(this, "SageMakerExecutionRole", {
      assumedBy: new ServicePrincipal("sagemaker.amazonaws.com"),
      inlinePolicies: {
        executionPolicies: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                "cloudwatch:PutMetricData",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
                "logs:CreateLogGroup",
                "logs:DescribeLogStreams",
              ],
              resources: ["*"],
            }),
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                "ecr:GetAuthorizationToken",
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetDownloadUrlForLayer",
                "ecr:BatchGetImage",
              ],
              resources: ["*"],
            }),
            new PolicyStatement({
              effect: Effect.ALLOW,
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
      anomalyDetectionModelAsset
    );

    new cdk.CfnOutput(this, "SimulationEndpointName", {
      value: simulationEndpoint.attrEndpointName,
    });
    new cdk.CfnOutput(this, "AnomalyDetectionEndpointName", {
      value: anomalyDetectionEndpoint.attrEndpointName,
    });
  }

  private createSimulationEndpoint(
    props: IotTwinMakerSageMakerStackProps,
    executionRole: Role,
    dockerImageAsset: DockerImageAsset,
    simulationModelAsset: assets.Asset
  ): CfnEndpoint {
    const sageMakerSimulationModel = new CfnModel(
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

    const simulationEndpointConfig = new CfnEndpointConfig(
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

    const simulationEndpoint = new CfnEndpoint(this, "SimulationEndpoint", {
      endpointConfigName: simulationEndpointConfig.attrEndpointConfigName!,
    });
    simulationEndpoint.node.addDependency(simulationEndpointConfig);
    return simulationEndpoint;
  }

  private createAnomalyDetectionEndpoint(
    executionRole: Role,
    anomalyDetectionModelAsset: assets.Asset
  ): CfnEndpoint {
    const sageMakerModel = new CfnModel(
      this,
      "SageMakerAnomalyDetectionModel",
      {
        executionRoleArn: executionRole.roleArn,
        modelName: `Anomaly-Detection-Model-${new Date().valueOf()}`,
        containers: [
          {
            image:
              "382416733822.dkr.ecr.us-east-1.amazonaws.com/randomcutforest:1",
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

    const sageMakerEndpointConfig = new CfnEndpointConfig(
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

    const sageMakerEndpoint = new CfnEndpoint(
      this,
      "AnomalyDetectionEndpoint",
      {
        endpointConfigName: sageMakerEndpointConfig.attrEndpointConfigName!,
      }
    );
    sageMakerEndpoint.node.addDependency(sageMakerEndpointConfig);
    return sageMakerEndpoint;
  }
}
