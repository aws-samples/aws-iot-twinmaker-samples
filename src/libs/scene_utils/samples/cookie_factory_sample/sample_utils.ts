// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2022
// SPDX-License-Identifier: Apache-2.0

import { readFileSync } from 'fs';
import minimist from 'minimist';
import { ModelRefNode } from '../../node/model.ts/model_ref';
import { withTrailingSlash } from '../../utils/file_utils';
import { parse } from 'csv-parse/sync';
import { ModelType } from '../../utils/types';
import { basename } from 'path';

export interface CookieFactorySampleArguments {
  workspaceId: string;
  sceneId: string;
  assetDirPath: string;
}

export const help = () => {
  console.log(`Configure the AWS credentials and AWS region in your environment by setting env variables:
    * AWS_ACCESS_KEY_ID
    * AWS_SECRET_ACCESS_KEY
    * AWS_SESSION_TOKEN
    * AWS_REGION (e.g. us-east-1)
  
  Usage: 
    
    arguments:
      --workspaceId         REQUIRED
      --sceneId             REQUIRED
      --assetDirPath        REQUIRED
    
    CookieFactory sample:
      npx ts-node src/cookie_factory_sample/sample.ts --workspaceId CookieFactory --sceneId FactoryScene --assetDirPath ~/Documents/Cookie_Factory_Warehouse/
    `);
};

// Parses command-line arguments for the sample files to extract the supported settings.
export const parseArgs = (): CookieFactorySampleArguments => {
  const args: CookieFactorySampleArguments = {
    workspaceId: '',
    sceneId: '',
    assetDirPath: '',
  };
  const parsedArgs = minimist(process.argv.slice(2));
  for (const arg of Object.keys(parsedArgs)) {
    switch (arg) {
      case 'h':
      case 'help':
        help();
        process.exit(0);
      case 'workspaceId':
        args.workspaceId = parsedArgs[arg];
        break;
      case 'sceneId':
        args.sceneId = parsedArgs[arg];
        break;
      case 'assetDirPath':
        const assetDirPath = parsedArgs[arg] as string;
        args.assetDirPath = withTrailingSlash(assetDirPath);
        break;
      case '_':
        break;
      default:
        console.error(`unknown arg "--${arg}"`);
        help();
        process.exit(1);
    }
  }

  if (args.workspaceId === '' || args.sceneId === '' || args.assetDirPath === '') {
    help();
    process.exit(1);
  }
  return args;
};

// Convert 3D file to a ModelRef object
export const assetToModelRef = (assetPath: string, nodeName?: string): ModelRefNode => {
  const fileName = basename(assetPath);
  const fileNameSplit = fileName.split('.');
  return new ModelRefNode(nodeName ?? fileNameSplit[0], fileName, fileNameSplit[1].toUpperCase() as ModelType);
};

// Parse Mixer Transform CSV
type MixerTransform = {
  name: string;
  pos_x: number;
  pos_y: number;
  pos_z: number;
  rot_x: number;
  rot_y: number;
  rot_z: number;
  s_x: number;
  s_y: number;
  s_z: number;
};

// Load bulk transforms of assets from a CSV
export const parseCsv = (filePath: string): MixerTransform[] => {
  const headers = ['name', 'pos_x', 'pos_y', 'pos_z', 'rot_x', 'rot_y', 'rot_z', 's_x', 's_y', 's_z'];
  const fileContent = readFileSync(filePath, { encoding: 'utf-8' });

  const content = parse(fileContent, {
    delimiter: ',',
    columns: headers,
  });

  // Ensure values are numbers
  const transforms: MixerTransform[] = [];
  for (const row of content) {
    const transform: MixerTransform = {
      name: row.name,
      pos_x: +row.pos_x,
      pos_y: +row.pos_y,
      pos_z: +row.pos_z,
      rot_x: +row.rot_x,
      rot_y: +row.rot_y,
      rot_z: +row.rot_z,
      s_x: +row.s_x,
      s_y: +row.s_y,
      s_z: +row.s_z,
    };
    transforms.push(transform);
  }
  return transforms;
};

// Set transform of a Mixer asset
export const processMixerTransform = (mixerNode: ModelRefNode, mixerName: string, content: MixerTransform[]) => {
  const index = parseInt(mixerName.split('_')[1]);
  const row = content[index + 1];
  mixerNode
    .withPosition({ x: row.pos_x, y: row.pos_y, z: row.pos_z })
    .withRotation({ x: row.rot_x, y: row.rot_y, z: row.rot_z })
    .withScale({ x: row.s_x, y: row.s_y, z: row.s_z });
};
