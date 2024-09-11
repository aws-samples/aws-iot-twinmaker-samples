// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2021
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import {CustomResource, NestedStack, Fn} from 'aws-cdk-lib';
import * as lambdapython from "@aws-cdk/aws-lambda-python-alpha";
import * as iam from "aws-cdk-lib/aws-iam";
import {Effect, PolicyStatement} from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from 'aws-cdk-lib/aws-logs';
import * as path from 'path';
import * as iottwinmaker from "aws-cdk-lib/aws-iottwinmaker";
import * as assets from "aws-cdk-lib/aws-s3-assets";
import { CfnOutput } from "aws-cdk-lib/core";
import {Construct} from "constructs";
import * as fs from "fs";
import * as nagsuppressions_stack from './nagsuppressions';

const sample_libs_root = path.join(__dirname,"..", "..","..","..","..","libs");

export interface TmdtAppProps  extends cdk.NestedStackProps{
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
export class TmdtApplication extends NestedStack {

    constructor(scope: Construct, id: string, props: TmdtAppProps) {
        super(scope, id);

        const verbose = new VerboseLogger(this);

        verbose.log(`tmdtRoot: ${props.tmdtRoot}`);
        nagsuppressions_stack.applySuppressions(this);

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
                    if (propertiesDetails) {
                        var filteredProperties = Object.entries(propertiesDetails).reduce((propertiesAccumulator, [propName, propDetail]) => {
                            if (propDetail.hasOwnProperty("value") && propDetail['value'] != undefined) {
                                propertiesAccumulator[propName] = {
                                    "value": propDetail['value']
                                };
                            }
                            return propertiesAccumulator;
                        }, {} as { [key: string]: object });
                    } else {
                        var filteredProperties: { [key: string]: object; } = {};
                    }

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
            verbose.log(`filteredComponentDetails for entity ${entity['entityId']}: ${JSON.stringify(filteredComponentDetails)}`);
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
            const modelFilePath = path.join(props.tmdtRoot, '3d_models', model);
            verbose.log(`modelFilePath: ${modelFilePath}`);
            const modelName = path.basename(path.join(props.tmdtRoot, '3d_models', model), ".glb"); // Note: GLTF not supported yet in this sample
            var modelAsset = new assets.Asset(this, `${modelName}-asset`, {
                path: modelFilePath,
            });
            assetsBucket = modelAsset.s3BucketName;
            assetMap[model] = modelAsset.s3ObjectUrl;
        }

        if (tmdtConfig['data']) {
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
        }

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
            entry: path.join(__dirname, '..', '..', 'iottwinmaker_data_custom_resource_handler'),
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
