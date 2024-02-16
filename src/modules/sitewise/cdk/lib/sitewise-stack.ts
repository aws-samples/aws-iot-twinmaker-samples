// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as sfn from '@aws-cdk/aws-stepfunctions';
import * as tasks from '@aws-cdk/aws-stepfunctions-tasks';

import * as path from 'path';
import console = require('console');

export class SiteWiseStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // The code that defines your stack goes here
        const iottwinmaker_connector_role = new iam.Role(this, 'iottwinmaker_connector_role', {
            assumedBy: new iam.CompositePrincipal(
                new iam.ServicePrincipal('lambda.amazonaws.com'),
                new iam.ServicePrincipal('states.amazonaws.com'),
                new iam.ServicePrincipal('events.amazonaws.com'),
                new iam.ServicePrincipal('iottwinmaker.amazonaws.com'),
            ),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('AWSStepFunctionsReadOnlyAccess'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('SecretsManagerReadWrite')
            ]
        });

        const policy = new iam.ManagedPolicy(this, "IoTTwinMakerFullAccessPolicy", {
            statements: [
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ["*" ],
                    resources: ["*"]
                })
            ],
            roles: [iottwinmaker_connector_role]
        });

        console.log("PWD:" + __dirname)
        const iottwinmaker_env = new lambda.LayerVersion(this, 'iottwinmaker_env', {
            code: lambda.Code.fromAsset(path.join(__dirname, '..', '..', '..', '..', '..', 'src', 'libs', 'connector_utils')),
            compatibleRuntimes: [lambda.Runtime.PYTHON_3_9, lambda.Runtime.PYTHON_3_8, lambda.Runtime.PYTHON_3_7, lambda.Runtime.PYTHON_3_10]
        });

        /***************************/
        /* SiteWise step function */
        /***************************/

        const sitewise_exporter_lambda = new lambda.Function(this, 'sitewiseExporterLambda', {
            code: lambda.Code.fromAsset(path.join(__dirname, '..', '..', '..', 'sitewise', 'lib')),
            handler: this.node.tryGetContext('SiteWiseExporterHandler'),
            memorySize: 256,
            role: iottwinmaker_connector_role,
            runtime: lambda.Runtime.PYTHON_3_9,
            timeout: cdk.Duration.minutes(15),
            layers: [iottwinmaker_env],
            environment: {
                'AWS_ENDPOINT': this.node.tryGetContext('AWSAPIEndpoint')
            }
        });

        const iottwinmaker_sitewise_importer = new lambda.Function(this, 'iottwinmakerSiteWiseImporterLambda', {
            code: lambda.Code.fromAsset(path.join(__dirname, '..', '..', '..', 'sitewise', 'lib')),
            handler: this.node.tryGetContext('IoTTwinMakerSiteWiseImporterHandler'),
            memorySize: 256,
            role: iottwinmaker_connector_role,
            runtime: lambda.Runtime.PYTHON_3_9,
            timeout: cdk.Duration.minutes(15),
            layers: [iottwinmaker_env],
            environment: {
                'AWS_ENDPOINT': this.node.tryGetContext('AWSAPIEndpoint')
            }
        });
        const sitewise_export_task = new tasks.LambdaInvoke(this, 'sitewise_export', {
            lambdaFunction: sitewise_exporter_lambda,
            outputPath: '$.Payload'
        });
        const sitewise_import_task = new tasks.LambdaInvoke(this, 'sitewise_import', {
            lambdaFunction: iottwinmaker_sitewise_importer
        });
        const sitewise_sfn_defn = sitewise_export_task.next(sitewise_import_task);
        const sitewise_sfn = new sfn.StateMachine(this, 'sitewise_to_iottwinmaker', {
            definition: sitewise_sfn_defn
        });

    }
}
