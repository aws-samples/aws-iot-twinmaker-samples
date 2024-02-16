// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2021
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import {CustomResource} from 'aws-cdk-lib';
import * as lambdapython from "@aws-cdk/aws-lambda-python-alpha";
import * as iam from "aws-cdk-lib/aws-iam";
import {Effect, PolicyStatement} from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from 'aws-cdk-lib/aws-logs';
import * as path from 'path';

import * as timestream from "aws-cdk-lib/aws-timestream";
import * as iottwinmaker from "aws-cdk-lib/aws-iottwinmaker";
import * as assets from "aws-cdk-lib/aws-s3-assets";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { CfnOutput } from "aws-cdk-lib/core";
import {Construct} from "constructs";
import CognitoAuthRole from "./CognitoAuthRole";
import * as fs from "fs";

const sample_libs_root = path.join(__dirname, "..","..","..","..","libs");
const sample_modules_root = path.join(__dirname, "..","..","..","..", "modules");
const cookiefactoryv2_root = path.join(__dirname, "..","..","..","..", "workspaces", "cookiefactoryv2");

export interface TmdtAppProps {
    workspace_id: string;
    workspaceBucket: string;
    tmdtRoot: string;
    replacements?: { [key: string]: string };
    account: string;
    region: string;
    additionalDataPolicies?: PolicyStatement[];
}

// verbose logger for debugging
// enable with `--context verboselogging=true` parameter to `cdk deploy`
class VerboseLogger {
    enabled: boolean;

    constructor(scope: Construct) {
        this.enabled = scope.node.tryGetContext("verboselogging") == 'true';
    }

    log(str: string) {
        if (this.enabled) {
            console.log(str);
        }
    }
}

function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function replaceAll(str: string, find: string, replace: string) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

// Note: this construct currently only handles deployments less than 200 resources
// TMDT = IoT TwinMaker Development Tools - https://github.com/awslabs/iot-app-kit/tree/main/packages/tools-iottwinmaker
export class TmdtApplication extends Construct {

    constructor(scope: Construct, id: string, props: TmdtAppProps) {
        super(scope, id);

        const verbose = new VerboseLogger(this);

        verbose.log(`tmdtRoot: ${props.tmdtRoot}`);

        var tmdt_config_buffer = fs.readFileSync(`${props.tmdtRoot}/tmdt.json`, 'utf-8');
        var tmdt_config_str_original = `${tmdt_config_buffer}`

        var tmdt_config_str = tmdt_config_str_original;

        // simple string replacement for props.replacement - e.g. to replace source ARN references with destination-generated ones
        for (const k in props.replacements) {
            tmdt_config_str = replaceAll(tmdt_config_str, k, props.replacements[k])
        }

        var tmdtConfig: any = JSON.parse(tmdt_config_str)

        verbose.log("========= tmdt.json (original) =========")
        verbose.log(JSON.stringify(JSON.parse(tmdt_config_str_original), null, 4));
        verbose.log("========= tmdt.json (replaced) =========")
        verbose.log(JSON.stringify(tmdtConfig, null, 4));

        var workspaceId = props.workspace_id;

        // prepare component type resources
        var componentTypesMap : any = {};
        for (const componentTypeFile of tmdtConfig['component_types']) {
            verbose.log(componentTypeFile)
            var componentTypeFileBuffer = fs.readFileSync(path.join(props.tmdtRoot, componentTypeFile), 'utf-8');

            // e.g. replace Lambda references in component types to updated ones
            for (const k in props.replacements) {
                componentTypeFileBuffer = tmdt_config_str = replaceAll(componentTypeFileBuffer, k, props.replacements[k])
            }

            var componentTypeDefinition = JSON.parse(`${componentTypeFileBuffer}`)
            // remove inherited properties
            var propertyDefinitions = componentTypeDefinition['propertyDefinitions'] as object;
            if (propertyDefinitions != undefined) {
                const filtered_property_definitions = Object.entries(propertyDefinitions).reduce((acc, [key, value]) => {
                    if (!value['isInherited']) {
                        acc[key] = value;
                    } else if ('defaultValue' in value) {
                        acc[key] = { defaultValue: value['defaultValue'] };
                    }
                    return acc;
                }, {} as { [key: string]: object });
                componentTypeDefinition['propertyDefinitions'] = filtered_property_definitions;
            }
            // remove inherited functions
            var componentTypeFunctions = componentTypeDefinition['functions'] as object;
            if (componentTypeFunctions != undefined) {
                const filtered_functions = Object.entries(componentTypeFunctions).reduce((acc, [key, value]) => {
                    if (!value['isInherited']) {
                        acc[key] = value;
                    }
                    return acc;
                }, {} as { [key: string]: object });
                componentTypeDefinition['functions'] = filtered_functions;
            }
            verbose.log(componentTypeDefinition);

            // generate the CFN resource and save a reference to it so we can later model resource dependencies
            componentTypesMap[componentTypeDefinition["componentTypeId"]] = new iottwinmaker.CfnComponentType(this, componentTypeDefinition["componentTypeId"], {
                componentTypeId: componentTypeDefinition["componentTypeId"],
                workspaceId: workspaceId,
                description: componentTypeDefinition["description"],
                extendsFrom: componentTypeDefinition["extendsFrom"],
                functions: componentTypeDefinition["functions"],
                isSingleton: componentTypeDefinition["isSingleton"],

                // Note: for this sample, propertyDefinitions in the TMDT project are assumed to not include inherited properties
                propertyDefinitions: componentTypeDefinition['propertyDefinitions']
            })
        }

        // model component type dependencies in CFN:
        // for each file, define a CFN dependency between the resource references in `extendsFrom`
        for (const componentTypeFile of tmdtConfig['component_types']) {
            componentTypeFileBuffer = fs.readFileSync(path.join(props.tmdtRoot, componentTypeFile), 'utf-8');
            componentTypeDefinition = JSON.parse(`${componentTypeFileBuffer}`)
            if (componentTypeDefinition["extendsFrom"]) {
                for (var parentComponentTypeId of componentTypeDefinition["extendsFrom"]) {
                    if (componentTypesMap.hasOwnProperty(parentComponentTypeId)) {
                        var myComponentTypeId = componentTypeDefinition["componentTypeId"];
                        var myComponentCfnResource = componentTypesMap[myComponentTypeId];
                        var parentComponentCfnResource = componentTypesMap[parentComponentTypeId];
                        myComponentCfnResource.node.addDependency(parentComponentCfnResource);
                    } else {
                        if (!parentComponentTypeId.toString().startsWith("com.amazon.iottwinmaker")) {
                            console.warn(`unknown component type id: ${parentComponentTypeId}`);
                        }
                    }
                }
            }
        }

        // prepare entity resources
        var entityResources : any = {};
        var entitiesFileBuffer = fs.readFileSync(path.join(props.tmdtRoot, "entities.json"), 'utf-8');
        for (const k in props.replacements) {
            entitiesFileBuffer = replaceAll(entitiesFileBuffer, k, props.replacements[k])
        }

        var entities = JSON.parse(`${entitiesFileBuffer}`)

        for (const entity of entities) {
            verbose.log(entity)

            var componentsDetails = entity['components'] as object;
            var filteredComponentDetails;

            // remove fields from materialized TMDT entity snapshot that are not allowed when calling create entity (such as definitions from component-type)
            if (componentsDetails != undefined) {
                filteredComponentDetails = Object.entries(componentsDetails).reduce((acc, [componentName, componentDetail]) => {
                    var propertiesDetails = componentDetail['properties'] as object;
                    var filteredProperties = Object.entries(propertiesDetails).reduce((propertiesAccumulator, [propName, propDetail]) => {
                        if (propDetail.hasOwnProperty("value") && propDetail['value'] != undefined) {
                            propertiesAccumulator[propName] = {
                                "value": propDetail['value']
                            };
                        }
                        return propertiesAccumulator;
                    }, {} as { [key: string]: object });

                    // process
                    acc[componentName] = {
                        'componentTypeId': componentDetail['componentTypeId'],
                        'properties': filteredProperties,
                    };
                    return acc;
                }, {} as { [key: string]: object });
            } else {
                filteredComponentDetails = [];
            }

            entity['components'] = filteredComponentDetails
            entity['workspaceId'] = workspaceId;

            // generate the CFN resource and save a reference to it so we can later model resource dependencies
            entityResources[entity['entityId']] = new iottwinmaker.CfnEntity(this, entity['entityId'], entity);
        }

        // model dependencies
        for (var entity of entities) {
            var myEntityId = entity["entityId"];
            var myEntity = entityResources[myEntityId];

            if (entity['parentEntityId']) {
                if (entityResources.hasOwnProperty(entity['parentEntityId'])) {
                    var parentEntity = entityResources[entity['parentEntityId']];
                    myEntity.node.addDependency(parentEntity);
                } else {
                    if(entity['parentEntityId'] != '$ROOT') {
                        console.warn(`ignoring unknown parent entity property reference: entity=${myEntityId} unknown parent=${entity['parentEntityId']}`);
                    }
                }
            }

            if (entity['components']) {
                let k: keyof typeof entity['components']; // https://effectivetypescript.com/2020/05/26/iterate-objects/
                for (k in entity['components']) {
                    const v = entity['components'][k];
                    const componentTypeId = v['componentTypeId'];
                    if (componentTypesMap.hasOwnProperty(componentTypeId)) {
                        var componentTypeResource = componentTypesMap[componentTypeId];
                        myEntity.node.addDependency(componentTypeResource);
                    }
                }
            }
        }

        var assetMap : any = {};
        var assetsBucket : string | undefined;

        // create scenes
        // note: CustomResource lifecycle lambda currently handles ModelRef workspace bucket replacement
        for (var scene of tmdtConfig['scenes']) {
            const sceneFilePath = path.join(props.tmdtRoot, scene);
            verbose.log(`sceneFilePath: ${sceneFilePath}`);
            const sceneName = path.basename(path.join(props.tmdtRoot, scene), ".json");
            var sceneResource = new iottwinmaker.CfnScene(this, scene, {
                workspaceId: workspaceId,
                sceneId: sceneName,
                contentLocation: `s3://${props.workspaceBucket}/${sceneName}.json`,
            })

            var sceneAsset = new assets.Asset(this, `${sceneName}-asset`, {
                path: sceneFilePath,
            });
            assetsBucket = sceneAsset.s3BucketName;
            assetMap[scene] = sceneAsset.s3ObjectUrl;
        }

        for (var model of tmdtConfig['models']) {
            verbose.log(`model: ${model}`);
            verbose.log(`props.tmdtRoot: ${props.tmdtRoot}`);
            const modelFilePath = path.join(props.tmdtRoot, model);
            verbose.log(`modelFilePath: ${modelFilePath}`);
            const modelName = path.basename(path.join(props.tmdtRoot, model), ".glb"); // Note: GLTF not supported yet in this sample
            var modelAsset = new assets.Asset(this, `${modelName}-asset`, {
                path: modelFilePath,
            });
            assetsBucket = modelAsset.s3BucketName;
            assetMap[model] = modelAsset.s3ObjectUrl;
        }

        for (var data of tmdtConfig['data']) {
            verbose.log(`data: ${JSON.stringify(data)}`);
            verbose.log(`props.tmdtRoot: ${props.tmdtRoot}`);
            const dataFilePath = path.join(props.tmdtRoot, data['source']);
            verbose.log(`dataFilePath: ${dataFilePath}`);
            const dataName = path.basename(dataFilePath);
            var dataAsset = new assets.Asset(this, `${dataName}-asset`, {
                path: dataFilePath,
            });
            assetsBucket = dataAsset.s3BucketName;
            assetMap[data['source']] = dataAsset.s3ObjectUrl;
        }
        verbose.log(`assetMap: ${assetMap}`);

        const iottwinmakerDataCustomResourceLifecycleExecutionRole = new iam.Role(this, 'iottwinmakerCustomResourceLifecycleFunctionRole', {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        });
        iottwinmakerDataCustomResourceLifecycleExecutionRole.addManagedPolicy(iam.ManagedPolicy.fromManagedPolicyArn(this, "lambdaExecRole", "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"))

        // permissions to determine workspace bucket from workspace
        iottwinmakerDataCustomResourceLifecycleExecutionRole.addToPolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            resources: [
                `arn:aws:iottwinmaker:${props.region}:${props.account}:workspace/${props.workspace_id}`
            ],
            actions: [
                "iottwinmaker:GetWorkspace"
            ]
        }));

        // permissions to copy project assets (GLB files, scene file, etc.) to IoT TwinMaker workspace bucket
        iottwinmakerDataCustomResourceLifecycleExecutionRole.addToPolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            resources: [
                `arn:aws:s3:::${props.workspaceBucket}/*`
            ],
            actions: [
                "s3:PutObject"
            ]
        }));

        // permissions to copy project assets (GLB files, scene file, etc.) from CFN assets bucket
        if (assetsBucket) {
            iottwinmakerDataCustomResourceLifecycleExecutionRole.addToPolicy(new PolicyStatement({
                effect: Effect.ALLOW,
                resources: [
                    `arn:aws:s3:::${assetsBucket}`,
                    `arn:aws:s3:::${assetsBucket}/*`,
                ],
                actions: [
                    "s3:GetObject",
                    "s3:ListBucket",
                ]
            }));
        }

        // add custom permissions for managing sample data assets (e.g. writing to Timestream, KVS, etc.
        if (props.additionalDataPolicies) {
            for (var policy of props.additionalDataPolicies) {
                iottwinmakerDataCustomResourceLifecycleExecutionRole.addToPolicy(policy);
            }
        }

        const iottwinmakerDataCustomResourceHandler = new lambdapython.PythonFunction(this, 'iottwinmakerDataCustomResourceHandler', {
            entry: path.join(__dirname, '..', 'iottwinmaker_data_custom_resource_handler'),
            layers: [
                new lambdapython.PythonLayerVersion(this, 'opencv_lambda_layer', {
                    entry: path.join(sample_libs_root, 'opencv_utils'),
                    compatibleRuntimes: [lambda.Runtime.PYTHON_3_10],
                }),
            ],
            handler: "handler",
            index: 'data_resource_handler.py',
            memorySize: 256,
            role: iottwinmakerDataCustomResourceLifecycleExecutionRole,
            runtime: lambda.Runtime.PYTHON_3_10,
            timeout: cdk.Duration.minutes(15),
            logRetention: logs.RetentionDays.ONE_DAY,
        });

        // custom resource to move assets into IoT TwinMaker application
        const iottwinmakerWorkspaceData = new CustomResource(this, "iottwinmakerWorkspaceData", {
            serviceToken: iottwinmakerDataCustomResourceHandler.functionArn,
            properties: {
                "workspaceId": workspaceId,
                "tmdt.json": JSON.stringify(tmdtConfig),
                "asset_map": assetMap
            }
        });
    }
}

export class CookieFactoryV2Stack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

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
            selfSignUpEnabled: false, 
            signInAliases: {
                email: true,
            },
            autoVerify: {
                email: false,
            },
            accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
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
              },
            preventUserExistenceErrors: true,
        });

        const cfnUserPoolUser = new cognito.CfnUserPoolUser(this, 'MyCfnUserPoolUser', {
            userPoolId: userPool.userPoolId,
            userAttributes: [
                {
                    name: 'email_verified',
                    value: 'true',
                },
                {
                    name: 'email',
                    value: 'user@cookiefactory',
                }
            ],
            username: 'user@cookiefactory',
            forceAliasCreation: true,
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
                resources: ["*"],
            })
        );
        authenticatedRole.role.addToPolicy(
            new iam.PolicyStatement({
                actions: ["s3:GetObject"],
                effect: iam.Effect.ALLOW,
                resources: [`arn:aws:s3:::${workspaceBucket}/*`],
            })
        );

         // Export values
        new CfnOutput(this, "UserPoolId", {
            value: userPool.userPoolId,
        });
        new CfnOutput(this, "ClientId", {
            value: userPoolClient.userPoolClientId,
        });
        new CfnOutput(this, "IdentityPoolId", {
            value: identityPool.ref,
        });

        // lambda layer for helper utilities for implementing UDQ Lambdas
        const udqHelperLayer = new lambdapython.PythonLayerVersion(this, 'udq_utils_layer', {
            entry: path.join(sample_libs_root, "udq_helper_utils"),
            compatibleRuntimes: [lambda.Runtime.PYTHON_3_10]
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

        // synthetic data lambda
        const syntheticDataUDQ = new lambdapython.PythonFunction(this, 'syntheticDataUDQ', {
            entry: path.join(cookiefactoryv2_root, "cdk", "synthetic_replay_connector"),
            layers: [
                udqHelperLayer,
                pandasLayer,
            ],
            // functionName starts with "iottwinmaker-" so console-generated workspace role can invoke it
            functionName: `iottwinmaker-synthUDQ-${this.stackName}`,
            handler: "lambda_handler",
            index: 'synthetic_udq_reader.py',
            memorySize: 256,
            role: timestreamUdqRole,
            runtime: lambda.Runtime.PYTHON_3_10,
            timeout: cdk.Duration.minutes(15),
            logRetention: logs.RetentionDays.ONE_DAY,
            environment: {
                "TELEMETRY_DATA_FILE_NAME": 'demoTelemetryData.json',
                "TELEMETRY_DATA_TIME_INTERVAL_SECONDS": '10',
            }
        });
        //endregion

        // TMDT application construct
        var tmdtApp = new TmdtApplication(this, "TmdtApp", {
            workspace_id: workspaceId,
            workspaceBucket: workspaceBucket,
            tmdtRoot: path.join(cookiefactoryv2_root, "tmdt_project"),
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
        tmdtApp.node.addDependency(timestreamTable);
    }
}
