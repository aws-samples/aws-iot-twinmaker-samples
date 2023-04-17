// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2022
// SPDX-License-Identifier: Apache-2.0

import minimist from 'minimist';
import { createInterface } from 'readline';
import { CesiumClient } from '../../client/cesium';
import { promisify } from 'util';

/**
 * The command line arguments determine which steps of the process this script will run
 * 1. Upload 3D asset to Cesium Ion, wait for tiling
 * 2. Create archive for tileset
 * 3. Download archive for tileset
 * 4. Upload tileset to the IoT TwinMaker workspace S3 bucket
 * 5. Add tileset to IoT TwinMaker scene
 */
export interface CesiumSampleArguments {
  workspaceId: string;
  sceneId: string;
  // Run steps 1-5
  assetFilePath?: string;
  dracoCompression?: boolean;
  // Run steps 2-5
  cesiumAssetId?: string;
  // Run steps 3-5
  cesiumArchiveId?: string;
  // Run steps 4-5
  localArchivePath?: string;
  // Run step 5
  s3TilesName?: string;
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
    * assets:list, assets:read, assets:write, archives:read, archives:write
  
  Usage: 
  
    This script runs up to 5 steps to convert your 3D asset into 3D Tiles for use in an IoT TwinMaker scene.
    1. Upload 3D asset to Cesium Ion, wait for tiling
    2. Create archive for tileset
    3. Download archive for tileset
    4. Upload tileset to the IoT TwinMaker workspace S3 bucket
    5. Add tileset to IoT TwinMaker scene

    arguments:
      --workspaceId         REQUIRED
      --sceneId             REQUIRED
      --assetFilePath       OPTIONAL start at Step 1
      --dracoCompression    OPTIONAL supplement to starting at Step 1
      --cesiumAssetId       OPTIONAL start at Step 2, also required for starting at Step 3
      --cesiumArchiveId     OPTIONAL start at Step 3
      --localArchivePath    OPTIONAL start at Step 4
      --s3TilesName         OPTIONAL start at Step 5

    You must provide an IoT TwinMaker workspaceId and sceneId. Then use an argument to decide what step to start at for your use case.
    For example, if you have an asset already uploaded to Cesium Ion, provide the --cesiumAssetId argument to archive, download, and add
    the tileset to your scene.
    
    Sample upload from local point cloud source file:
      npx ts-node cesium_sample/sample.ts --workspaceId Factory --sceneId FactoryScene --assetFilePath ~/Documents/LaserScan.las

    Sample upload from local 3D model source file:
      npx ts-node cesium_sample/sample.ts --workspaceId Factory --sceneId FactoryScene --assetFilePath ~/Documents/Building.gltf --dracoCompression
  
    Sample create archive for tileset:
      npx ts-node cesium_sample/sample.ts --workspaceId Factory --sceneId FactoryScene --cesiumAssetId 1234567

    Sample download archive for tileset:
      npx ts-node cesium_sample/sample.ts --workspaceId Factory --sceneId FactoryScene --cesiumAssetId 1234567 --cesiumArchiveId 987654
    
    Sample upload tileset to S3:
      npx ts-node cesium_sample/sample.ts --workspaceId Factory --sceneId FactoryScene --localArchivePath ./TilesetName.zip
    
    Sample add tileset in S3 to IoT TwinMaker scene:
      npx ts-node cesium_sample/sample.ts --workspaceId Factory --sceneId FactoryScene --s3TilesName TilesetName
    `);
};

// Parses command-line arguments for the sample files to extract the supported settings.
export const parseArgs = (): CesiumSampleArguments => {
  const args: CesiumSampleArguments = {
    workspaceId: '',
    sceneId: '',
    assetFilePath: '',
    dracoCompression: false,
    cesiumAssetId: '',
    cesiumArchiveId: '',
    localArchivePath: '',
    s3TilesName: '',
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
      case 'dracoCompression':
        args.dracoCompression = true;
        break;
      case 'cesiumAssetId':
        args.cesiumAssetId = parsedArgs[arg];
        break;
      case 'cesiumArchiveId':
        args.cesiumArchiveId = parsedArgs[arg];
        break;
      case 'localArchivePath':
        args.localArchivePath = parsedArgs[arg];
        break;
      case 's3TilesName':
        args.s3TilesName = parsedArgs[arg];
        break;
      case '_':
        break;
      default:
        console.error(`unknown arg "--${arg}"`);
        help();
        process.exit(1);
    }
  }

  if (args.workspaceId === '' || args.sceneId === '') {
    help();
    process.exit(1);
  }
  return args;
};

export const disclaimer = async () => {
    const dividingLine = '-------------------------------------------------';
    const disclaimerText = `${dividingLine}
Cesium Ion is a 3rd party service not affiliated with AWS. 
By moving forward you are accepting the risk of using Cesium Ion to store your assets. 
We recommend reviewing terms and conditions that apply to this script on the website of Cesium Ion at https://cesium.com/.
Would you like to opt-in? [yes/no]: `;

    const readLine = createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const question = promisify(readLine.question).bind(readLine);

    let answered = false;
    while (!answered) {
        const answer = await question(disclaimerText);
        switch(answer.toLowerCase()) {
            case 'yes':
                answered = true;
                readLine.close();
                break;
            case 'no':
                console.log('Exiting...');
                process.exit(1);
            default:
                break;
        }
    }
    console.log(dividingLine);
}

export interface TilesToSceneArguments {
  workspaceId: string;
  sceneId: string;
  tilesName: string;
}

export const getCesiumAccessToken = () => {
  if (process.env.CESIUM_ACCESS_TOKEN === undefined) {
    throw 'ERROR: Environment variable CESIUM_ACCESS_TOKEN has not been configured. Run this script with "-h" to see usage details.';
  }
  return process.env.CESIUM_ACCESS_TOKEN;
}

export const uploadAssetForTiling = async (assetPath: string, dracoCompression: boolean | undefined, cesiumAccessToken: string) => {
  let tilingDone = false;
  let assetId: string | undefined;
  const cesiumClient: CesiumClient = new CesiumClient();

  if (!!assetPath) {
    // If requested, upload an asset to Cesium
    console.log('Uploading asset to Cesium Ion...');
    const description = 'Asset to be visualized in AWS IoT TwinMaker';
    [assetId, tilingDone] = await cesiumClient.upload(cesiumAccessToken, assetPath, description, dracoCompression);
  }

  return [assetId, tilingDone] as const;
}

export const createArchiveForAsset = async (assetId: string, cesiumAccessToken: string) => {
  let archiveCreated = false;
  let archiveId: string | undefined;
  const cesiumClient: CesiumClient = new CesiumClient();

  if (!!assetId) {
    // First check if an archive is already available
    const response = await cesiumClient.listArchivesRequest(cesiumAccessToken, assetId);
    const archiveList = JSON.parse(response.toString());
    for (const archive of archiveList.items) {
      // Return first archive
      return [archive.id, true];
    }
    // If no archive exists, create an archive
    console.log('Creating archive of asset...');
    [archiveId, archiveCreated] = await cesiumClient.createArchive(cesiumAccessToken, assetId);
  }

  return [archiveId, archiveCreated] as const;
}

export const downloadArchive = async (assetId: string, archiveId: string, cesiumAccessToken: string) => {
  let archivePath: string | undefined;
  const cesiumClient: CesiumClient = new CesiumClient();

  if (!!assetId && !!archiveId) {
    // If requested, download an archive of an asset in Cesium
    console.log('Downloading archive of asset...');
    archivePath = await cesiumClient.downloadArchive(cesiumAccessToken, assetId, archiveId);
  }

  return archivePath;
}