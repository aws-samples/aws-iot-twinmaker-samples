// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2022
// SPDX-License-Identifier: Apache-2.0

import { SceneFactoryImpl } from '../../factory/scene_factory_impl';
import { ModelRefNode } from '../../node/model.ts/model_ref';
import { createArchiveForAsset, disclaimer, downloadArchive, getCesiumAccessToken, parseArgs, uploadAssetForTiling } from './sample_utils';
import { parse } from 'path';

const { 
  workspaceId, 
  sceneId, 
  assetFilePath, 
  dracoCompression, 
  cesiumAssetId, 
  cesiumArchiveId, 
  localArchivePath, 
  s3TilesName 
} = parseArgs();

const factory = new SceneFactoryImpl();

const parseArchivePath = (archivePath: string | undefined) => {
  return archivePath ? parse(archivePath).name : archivePath;
}

// Create a scene or load an existing scene for updates
factory.loadOrCreateSceneIfNotExists(workspaceId, sceneId).then(async (twinMakerScene) => {
  // Require user input to opt-in to use Cesium Ion
  await disclaimer();

  // Uncomment this line to reset the scene on every run of this sample
  // twinMakerScene.clear();

  // Cesium access token must be provided by the environment variable CESIUM_ACCESS_TOKEN
  const cesiumAccessToken = getCesiumAccessToken();

  // Step 1:  Upload 3D asset to Cesium Ion, wait for tiling
  // If a local path is provided then upload the file
  let isTilingDone = false;
  let assetId = cesiumAssetId;
  if (!!assetFilePath) {
    [assetId, isTilingDone] = await uploadAssetForTiling(assetFilePath, dracoCompression, cesiumAccessToken);
    if (!isTilingDone) {
      console.error(`Check the asset tiling status in Cesium Ion: https://cesium.com/ion/assets/${assetId}`)
      return;
    }
  }

  // Step 2: Create archive for tileset
  // If only an assetId is provided or tiling is done on that asset from the previous step then create an archive
  let isArchiveCreated = false;
  let archiveId = cesiumArchiveId;
  if ((!!assetId && !archiveId) || isTilingDone) {
    [archiveId, isArchiveCreated] = await createArchiveForAsset(assetId!, cesiumAccessToken);
    if (!isArchiveCreated) {
      console.error(`Archive could not be created for asset with ID ${assetId}`);
      return;
    }
  }
  
  // Step 3: Download archive for tileset
  // If an assetId and archiveId is provided or an archive is created from the previous step then download the archive
  let archivePath = localArchivePath;
  if ((!!assetId && !!archiveId) || isArchiveCreated) {
    archivePath = await downloadArchive(assetId!, archiveId!, cesiumAccessToken);
    if (!archivePath) {
      console.error(`Archive with ID ${archiveId} could not be downloaded for asset with ID ${assetId}`);
      return;
    }
  }

  // Steps 4 and 5 to upload the tileset are handled in factory/scene_factory.save(), but prepped below
  // Step 4: If an archive path is provided or generated from the previous step then it will be uploaded to S3
  // Step 5: If the tileset name is provided and already uploaded to S3 then it will be added to your TwinMaker scene

  if (!archivePath && !s3TilesName) {
    console.error('Missing local tileset archive or tileset name in S3. Rerun this script with -h for more details.');
    return;
  }

  const tilesetFolderName = !!s3TilesName ? s3TilesName : parseArchivePath(archivePath);

  // Edit the scene
  console.log('Creating/Editing scene...');

  // Set the Environmental Preset in the Scene settings
  twinMakerScene.setEnviromentPreset('neutral');

  // Add 3D Tiles to the Scene
  const tilesetPath = `${tilesetFolderName}/tileset.json`;
  const tileNode = new ModelRefNode(tilesetFolderName!, tilesetPath, 'Tiles3D');

  // Upload tileset to S3 if there is a local path prepared
  if (!!archivePath) {
    tileNode.uploadModelFromLocalIfNotExist(archivePath);
  }

  twinMakerScene.addRootNodeIfNameNotExist(tileNode);

  // Save the changes to the Scene
  await factory.save(twinMakerScene);
}).catch(err => {
  console.error(err);
});
