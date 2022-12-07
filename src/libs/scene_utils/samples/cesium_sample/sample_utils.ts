// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2022
// SPDX-License-Identifier: Apache-2.0

import minimist from 'minimist';

export interface CesiumSampleArguments {
  workspaceId: string;
  sceneId: string;
  assetFilePath?: string;
  cesiumAssetId?: string;
  dracoCompression?: boolean;
}

export const help = () => {
  console.log(`Configure the AWS credentials and AWS region in your environment by setting env variables:
    * AWS_ACCESS_KEY_ID
    * AWS_SECRET_ACCESS_KEY
    * AWS_SESSION_TOKEN
    * AWS_REGION (e.g. us-east-1)
  
  For this sample you must also configure an environment variable with an access token to your Cesium Ion account:
    * CESIUM_ACCESS_TOKEN
  The token must have a minimum of the following permissions:
    * assets:list, assets:read, assets:write, exports:read, exports:write
  
  Usage: 
    
    arguments:
      --workspaceId         REQUIRED
      --sceneId             REQUIRED
      --assetFilePath       OPTIONAL
      --cesiumAssetId       OPTIONAL
      --dracoCompression    OPTIONAL
    
    Cesium Ion sample upload from local point cloud source file:
      npx ts-node src/cesium_sample/sample.ts --workspaceId Factory --sceneId FactoryScene --assetFilePath ~/Documents/LaserScan.las

    Cesium Ion sample upload from local 3D model source file:
      npx ts-node src/cesium_sample/sample.ts --workspaceId Factory --sceneId FactoryScene --assetFilePath ~/Documents/Building.gltf --dracoCompression
  
    Cesium Ion sample download tiles into scene:
      npx ts-node src/cesium_sample/sample.ts --workspaceId Factory --sceneId FactoryScene --cesiumAssetId 1234567
    `);
};

// Parses command-line arguments for the sample files to extract the supported settings.
export const parseArgs = (): CesiumSampleArguments => {
  const args: CesiumSampleArguments = {
    workspaceId: '',
    sceneId: '',
    assetFilePath: '',
    cesiumAssetId: '',
    dracoCompression: false,
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
      case 'assetFilePath':
        args.assetFilePath = parsedArgs[arg];
        break;
      case 'cesiumAssetId':
        args.cesiumAssetId = parsedArgs[arg];
        break;
      case 'dracoCompression':
        args.dracoCompression = true;
        break;
      case '_':
        break;
      default:
        console.error(`unknown arg "--${arg}"`);
        help();
        process.exit(1);
    }
  }

  const hasCesiumAssetId = args.cesiumAssetId !== '';
  const hasAssetFilePath = args.assetFilePath !== '';
  const isInvalid = hasCesiumAssetId == hasAssetFilePath;
  if (args.workspaceId === '' || args.sceneId === '' || isInvalid) {
    help();
    process.exit(1);
  }
  return args;
};
