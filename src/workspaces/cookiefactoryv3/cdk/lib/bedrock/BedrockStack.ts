// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2021
// SPDX-License-Identifier: Apache-2.0

import * as cdk from 'aws-cdk-lib';
import {NestedStack} from 'aws-cdk-lib';
import { CfnOutput } from "aws-cdk-lib/core";
import {Construct} from "constructs";
import { bedrock } from '@cdklabs/generative-ai-cdk-constructs';

import { NagSuppressions } from 'cdk-nag';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import * as nagsuppressions_stack from './nagsuppressions';

export interface BedrockResourcesProps  extends cdk.NestedStackProps{
    stack_name: string;
    documentBucket: IBucket;
    account: string;
    region: string;
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

export class BedrockResources extends NestedStack {
    knowledgeBaseId: string
    datasourceId: string
    
    constructor(scope: Construct, id: string, props: BedrockResourcesProps) {
        super(scope, id);

        const verbose = new VerboseLogger(this);
        const COLLECTION_NAME = `${props.stack_name}-collection`
        nagsuppressions_stack.applySuppressions(this);

        const kb = new bedrock.KnowledgeBase(this, `${props.stack_name}KnowledgeBase`, {
            embeddingsModel: bedrock.BedrockFoundationModel.TITAN_EMBED_TEXT_V1,
            instruction: 'Use this knowledge base to answer questions about freezer tunnels. ' +
              'It contains vendor manuals and standard operating procedures.',
          });
                    
        const datasource = new bedrock.S3DataSource(this, 'DataSource', {
        bucket: props.documentBucket,
        knowledgeBase: kb,
        dataSourceName: `${props.stack_name}-datasource`,
        chunkingStrategy: bedrock.ChunkingStrategy.FIXED_SIZE,
        maxTokens: 500,
        overlapPercentage: 20,
        });

        this.knowledgeBaseId = kb.knowledgeBaseId;
        this.datasourceId = datasource.dataSourceId;
          
        new CfnOutput(this, "KnowledgeBaseId", {
            value: this.knowledgeBaseId,
            exportName: 'KnowledgeBaseId' 
        });
        new CfnOutput(this, "DatasourceId", {
            value: this.datasourceId,
            exportName: 'DatasourceId' 
        });
    }
}
