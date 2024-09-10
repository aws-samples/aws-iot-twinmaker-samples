// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2021
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import {CustomResource, SecretValue} from 'aws-cdk-lib';
import * as lambdapython from "@aws-cdk/aws-lambda-python-alpha";
import * as iam from "aws-cdk-lib/aws-iam";
import {Effect, PolicyStatement} from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from 'aws-cdk-lib/aws-logs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as path from 'path';

import * as timestream from "aws-cdk-lib/aws-timestream";
import * as bedrockstack from "../lib/bedrock/BedrockStack"
import * as assets from "aws-cdk-lib/aws-s3-assets";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { CfnOutput } from "aws-cdk-lib/core";
import {Construct} from "constructs";
import CognitoAuthRole from "./CognitoAuthRole";
import * as nagsuppressions_stack from './nagsuppressions';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as twinmakerstack  from "./twinmaker/twinmakerStack"
import { OriginAccessIdentity } from 'aws-cdk-lib/aws-cloudfront';

const sample_libs_root = path.join(__dirname, "..","..","..","..","libs");
const sample_modules_root = path.join(__dirname, "..","..","..","..", "modules");
const cookiefactoryv3_root = path.join(__dirname, "..","..","..","..", "workspaces", "cookiefactoryv3");

export class CookieFactoryV3Stack extends cdk.Stack {
    tmdtApp: twinmakerstack.TmdtApplication
    bedrockResources: bedrockstack.BedrockResources
    oai: OriginAccessIdentity;
    
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        nagsuppressions_stack.applySuppressions(this);

        // IoT TwinMaker target environment to deploy to
        const workspaceId = this.node.tryGetContext("iottwinmakerWorkspaceId");
        const workspaceBucket = this.node.tryGetContext("iottwinmakerWorkspaceBucket");

        if (!workspaceId || !workspaceBucket) {
            throw Error("'iottwinmakerWorkspaceId' and 'iottwinmakerWorkspaceBucket' must be provided via --context or specified in cdk.json")
        }

        // Some resources like Lambda function names have a name restriction of 64 characters, since we suffix these functions with the stack the name can't be too long
        if (`${this.stackName}`.length > 32) {
            throw Error('stackName too long: stackName is used in some generated resource names with length restrictions, please use a stackName no longer than 32 characters')
        }
        // Create Cognito Resources: User Pool, User Client, User, Identity Pool 
        const userPool = new cognito.UserPool(this, "CookiefactoryUserPool", {
            userPoolName: "CookiefactoryUserPool",
            selfSignUpEnabled: true, 
            signInAliases: {
                email: true,
            },
            autoVerify: {
                email: true,
            },
            accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
            customAttributes: {
                title: new cognito.StringAttribute({ 
                    minLen: 0, 
                    maxLen: 50, // Set the maximum length as needed
                    mutable: true  // Set to false if you don't want the user to change this attribute after sign-up
                  }),
            },
            email: cognito.UserPoolEmail.withCognito(),
            mfa: cognito.Mfa.OFF,
            passwordPolicy: {
                minLength: 8,
                requireLowercase: true,
                requireUppercase: true,
                requireDigits: true,
                requireSymbols: true,
                tempPasswordValidity: cdk.Duration.days(7),
              },
            deletionProtection: false,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        const userPoolClient = new cognito.UserPoolClient(this, "CookiefactoryAppClient", {
            userPoolClientName: "CookiefactoryAppClient",
            userPool,
            accessTokenValidity: cdk.Duration.minutes(60),
            idTokenValidity: cdk.Duration.minutes(60),
            authFlows: {
                userSrp: true,
                userPassword: true
              },
            preventUserExistenceErrors: true,
        });


        const identityPool = new cognito.CfnIdentityPool(this, "CookiefactoryIdentityPool", {
            identityPoolName: "CookiefactoryIdentityPool",
            allowUnauthenticatedIdentities: false, 
            allowClassicFlow: false,
            cognitoIdentityProviders: [ {
                clientId: userPoolClient.userPoolClientId,
                providerName: userPool.userPoolProviderName,
                serverSideTokenCheck: false,
            }],
        });

        const authenticatedRole = new CognitoAuthRole(this, "CognitoAuthRole", {
            identityPool,
            region: this.region,
            account: this.account
        });

        authenticatedRole.role.addToPolicy(
            new iam.PolicyStatement({
                actions: [ "iottwinmaker:GetPropertyValue",
                    "iottwinmaker:ExecuteQuery",
                    "iottwinmaker:ListEntities",
                    "iottwinmaker:ListComponentTypes",
                    "iottwinmaker:GetPropertyValueHistory",
                    "iottwinmaker:GetScene",
                    "iottwinmaker:ListScenes",
                    "iottwinmaker:GetEntity",
                    "iottwinmaker:UpdateEntity",
                    "iottwinmaker:GetWorkspace",
                    "iottwinmaker:GetComponentType"],
                effect: iam.Effect.ALLOW,
                resources: [
                    `arn:aws:iottwinmaker:${this.region}:${this.account}:workspace/${workspaceId}/*`,
                    `arn:aws:iottwinmaker:${this.region}:${this.account}:workspace/${workspaceId}`
                ],
            })
        );
        authenticatedRole.role.addToPolicy(
            new iam.PolicyStatement({
                actions: ["iottwinmaker:ListWorkspaces"],
                effect: iam.Effect.ALLOW,
                resources: [`arn:aws:iottwinmaker:${this.region}:${this.account}:workspace/*`],
            })
        );
        authenticatedRole.role.addToPolicy(
            new iam.PolicyStatement({
                actions: ["s3:GetObject"],
                effect: iam.Effect.ALLOW,
                resources: [`arn:aws:s3:::${workspaceBucket}/*`],
            })
        );

        // Create CloudFront distribution
        const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OAI');
        this.oai = originAccessIdentity
        
        // Create a new S3 bucket
        const companyAssetsBucket = new s3.Bucket(this, 'CookiefactoryAssetsBucket', {
             removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production
             autoDeleteObjects: true, // NOT recommended for production
             publicReadAccess: false,
             blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
         });

        companyAssetsBucket.grantRead(originAccessIdentity);

          // Deploy local document to the bucket
        const bucketdeploy = new s3deploy.BucketDeployment(this, 'DeployDocuments', {
            sources: [s3deploy.Source.asset('documents/')], 
            destinationBucket: companyAssetsBucket
        });

          
        
 
         const distribution = new cloudfront.Distribution(this, 'ViteAppDistribution', {
             defaultBehavior: {
                 origin: new origins.S3Origin(companyAssetsBucket, { 
                    originAccessIdentity,
                    originPath: '/web'
                }),
                 viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
             },
             minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
             defaultRootObject: 'index.html',
         });

        // lambda layer for helper utilities for implementing UDQ Lambdas
        const udqHelperLayer = new lambdapython.PythonLayerVersion(this, 'udq_utils_layer', {
            entry: path.join(sample_libs_root, "udq_helper_utils"),
            compatibleRuntimes: [lambda.Runtime.PYTHON_3_10],
        });

        //region - sample infrastructure content for telemetry data in Timestream
        const timestreamDB = new timestream.CfnDatabase(this, "TimestreamTelemetry", {
            databaseName: `${this.stackName}`
        });
        const timestreamTable = new timestream.CfnTable(this, "Telemetry", {
            tableName: `Telemetry`,
            databaseName: `${timestreamDB.databaseName}`, // create implicit CFN dependency
            retentionProperties: {
                memoryStoreRetentionPeriodInHours: (24 * 30).toString(10),
                magneticStoreRetentionPeriodInDays: (24 * 30).toString(10)
            }
        });
        timestreamTable.node.addDependency(timestreamDB);

        const timestreamUdqRole = new iam.Role(this, 'timestreamUdqRole', {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        });
        timestreamUdqRole.addManagedPolicy(iam.ManagedPolicy.fromManagedPolicyArn(this, "lambdaExecRole", "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"))
        timestreamUdqRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonTimestreamReadOnlyAccess"))
        timestreamUdqRole.addToPolicy(
          new iam.PolicyStatement({
              actions: [
                  "iottwinmaker:GetEntity",
                  "iottwinmaker:GetWorkspace",
                ],
              effect: iam.Effect.ALLOW,
              resources: [
                  `arn:aws:iottwinmaker:${this.region}:${this.account}:workspace/${workspaceId}/*`,
                  `arn:aws:iottwinmaker:${this.region}:${this.account}:workspace/${workspaceId}`
              ],
          })
        );

        const timestreamReaderUDQ = new lambdapython.PythonFunction(this, 'timestreamReaderUDQ', {
            entry: path.join(sample_modules_root,"timestream_telemetry","lambda_function"),
            layers: [
                udqHelperLayer,
            ],
            // name starts with "iottwinmaker-" so console-generated workspace role can invoke it
            functionName: `iottwinmaker-tsUDQ-${this.stackName}`,
            handler: "lambda_handler",
            index: 'udq_data_reader.py',
            memorySize: 256,
            role: timestreamUdqRole,
            runtime: lambda.Runtime.PYTHON_3_10,
            timeout: cdk.Duration.minutes(15),
            logRetention: logs.RetentionDays.ONE_DAY,
            environment: {
                "TIMESTREAM_DATABASE_NAME": `${timestreamDB.databaseName}`,
                "TIMESTREAM_TABLE_NAME": `${timestreamTable.tableName}`,
            }
        });
        //endregion

        //region - sample infrastructure content for synthetic cookieline telemetry data
        // https://aws-sdk-pandas.readthedocs.io/en/stable/layers.html
        const pandasLayer = lambda.LayerVersion.fromLayerVersionArn(this,
          'awsPandasLayer', `arn:aws:lambda:${this.region}:336392948345:layer:AWSSDKPandas-Python310:11`)

        var telemetryDataAsset = new assets.Asset(this, `demo-data-asset`, {
            path: path.join(cookiefactoryv3_root, "cdk", "synthetic_replay_connector", "data.csv"),
        });

        // synthetic data lambda
        const syntheticDataUDQ = new lambdapython.PythonFunction(this, 'syntheticDataUDQ', {
            entry: path.join(cookiefactoryv3_root, "cdk", "synthetic_replay_connector"),
            layers: [
                udqHelperLayer,
                pandasLayer,
            ],
            // functionName starts with "iottwinmaker-" so console-generated workspace role can invoke it
            functionName: `iottwinmaker-synthUDQ-${this.stackName}`,
            handler: "lambda_handler",
            index: 'synthetic_udq_reader.py',
            memorySize: 1024,
            role: timestreamUdqRole,
            runtime: lambda.Runtime.PYTHON_3_10,
            timeout: cdk.Duration.minutes(15),
            logRetention: logs.RetentionDays.ONE_DAY,
            environment: {
                "TELEMETRY_DATA_FILE_NAME": 'demoTelemetryData.json',
                "TELEMETRY_DATA_TIME_INTERVAL_SECONDS": '10',
                "TELEMETRY_DATA_S3_FILE_BUCKET": telemetryDataAsset.s3BucketName,
                "TELEMETRY_DATA_S3_FILE_KEY": telemetryDataAsset.s3ObjectKey
            }
        });
        //endregion

        
        // TMDT application Nested Stack
        this.tmdtApp = new twinmakerstack.TmdtApplication(this, "TmdtApp", {
            workspace_id: workspaceId,
            workspaceBucket: workspaceBucket,
            tmdtRoot: path.join(cookiefactoryv3_root, "tmdt_project"),
            replacements: {
                "__FILL_IN_TS_DB__": `${timestreamDB.databaseName}`,
                "__TO_FILL_IN_TIMESTREAM_LAMBDA_ARN__": `${timestreamReaderUDQ.functionArn}`,
                "__TO_FILL_IN_SYNTHETIC_DATA_ARN__": `${syntheticDataUDQ.functionArn}`,
                '"targetEntityId"': '"TargetEntityId"',
            },
            account: this.account,
            region: this.region,

            // supply additional policies to the application lifecycle function to manage access for sample data assets
            additionalDataPolicies: [
                // permissions to write sample timestream data
                new PolicyStatement({
                    effect: Effect.ALLOW,
                    resources: [`arn:aws:timestream:${this.region}:${this.account}:database/${timestreamDB.databaseName}/table/${timestreamTable.tableName}`],
                    actions: ["timestream:WriteRecords"]
                }),
                new PolicyStatement({
                    effect: Effect.ALLOW,
                    resources: ["*"], // describe endpoints isn't resource-specific
                    actions: ["timestream:DescribeEndpoints",]
                }),
                // permissions to allow setting up sample video data in KVS
                new PolicyStatement({
                    effect: Effect.ALLOW,
                    resources: [
                        `arn:aws:kinesisvideo:${this.region}:${this.account}:stream/cookiefactory_mixerroom_camera_01/*`,
                        `arn:aws:kinesisvideo:${this.region}:${this.account}:stream/cookiefactory_mixerroom_camera_02/*`,
                    ],
                    actions: [
                        "kinesisvideo:PutMedia",
                        "kinesisvideo:GetDataEndpoint",
                        "kinesisvideo:CreateStream",
                    ]
                })
            ]
        });

        this.tmdtApp.node.addDependency(timestreamTable);

        // Create Bedrock Resources in nested stack
        this.bedrockResources = new bedrockstack.BedrockResources(this, "BedrockResources", {
            stack_name: this.stackName,
            documentBucket: companyAssetsBucket,
            account: this.account,
            region: this.region,            
        });
        this.bedrockResources.node.addDependency(companyAssetsBucket);

        const cookieFactorySecret = new secretsmanager.Secret(this, `CFV3ParamSecret`, {
            secretObjectValue: {
                workspaceId: SecretValue.unsafePlainText(workspaceId),
                userPoolId: SecretValue.unsafePlainText(userPool.userPoolId),
                clientId: SecretValue.unsafePlainText(userPoolClient.userPoolClientId),
                region: SecretValue.unsafePlainText(this.region),
                identityPoolId: SecretValue.unsafePlainText(identityPool.ref),
                distributionDomainName: SecretValue.unsafePlainText(distribution.distributionDomainName),
                companyAssetsBucketName: SecretValue.unsafePlainText(companyAssetsBucket.bucketName),
                originAccessIdentityId: SecretValue.unsafePlainText(this.oai.originAccessIdentityId),
                knowledgeBaseID: SecretValue.unsafePlainText(this.bedrockResources.knowledgeBaseId)
            },
            secretName: "CFV3Secrets",
            description: 'Cookie Factory Key Secrets'
        });


        new CfnOutput(this, "KnowledgeBaseID", {
            value: this.bedrockResources.knowledgeBaseId,
        })        

        new CfnOutput(this, "CompanyAssetsBucketName", {
            value: companyAssetsBucket.bucketName,
        })        

        new CfnOutput(this, "DistributionDomainName", {
            value: distribution.distributionDomainName,
        })        

        new CfnOutput(this, "IdentityPoolId", {
            value: identityPool.ref,
        })
        
        new CfnOutput(this, "Region", {
            value: this.region,
        });    
        
        new CfnOutput(this, "UserPoolClientId", {
            value: userPoolClient.userPoolClientId,
        });        

        new CfnOutput(this, "UserPoolId", {
            value: userPool.userPoolId,
        });

        new CfnOutput(this, "WorkspaceId", {
            value: workspaceId,
        });

        new CfnOutput(this, "originAccessId", {
            value: this.oai.originAccessIdentityId,
        });

         // Export values
        new CfnOutput(this, "CookieFactorySecretName", {
            value: cookieFactorySecret.secretName,
        });

    }
}
