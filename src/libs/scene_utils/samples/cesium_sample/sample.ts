// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2022
// SPDX-License-Identifier: Apache-2.0

import { CesiumClient } from '../../client/cesium';
import { SceneFactoryImpl } from '../../factory/scene_factory_impl';
import { ModelRefNode } from '../../node/model.ts/model_ref';
import { parseArgs } from './sample_utils';
import { getFileNameFromPath } from '../../utils/file_utils';
import { GeometryCompression } from '../../cesium/types';

const args = parseArgs();
const workspaceId = args.workspaceId;
const sceneId = args.sceneId;
const assetPath = args.assetFilePath;
const cesiumAccessToken = args.cesiumAccessToken!;
let cesiumAssetId = args.cesiumAssetId;
const dracoCompression = args.dracoCompression;

const factory = new SceneFactoryImpl();

// Create a scene or load an existing scene for updates
factory.loadOrCreateSceneIfNotExists(workspaceId, sceneId).then(async (twinMakerScene) => {
  // If requested, upload an asset to Cesium
  const fileName = getFileNameFromPath(assetPath);
  const fileNameSplit = fileName.split('.');
  let assetName = !!fileNameSplit ? fileNameSplit[0] : '';

  // Wait for a tiled asset - if there's no path then assume tiling is done
  let tilingDone = assetPath === '';

  const cesiumClient: CesiumClient = new CesiumClient();

  if (!!assetPath) {
    console.log('Uploading asset to Cesium Ion...');
    // Submit asset upload request
    const description = 'Asset to be visualized in AWS IoT TwinMaker';
    const compression: GeometryCompression = dracoCompression === true ? 'DRACO' : 'NONE';
    [cesiumAssetId, tilingDone] = await cesiumClient.upload(cesiumAccessToken, assetPath, description, compression);
  }

  // Only download Cesium tiles and edit the scene if the tiling on the asset is finished
  if (tilingDone) {
    // Add a Root Node to the Scene
    console.log('Creating/Editing Cookie Factory scene...');

    // Set the Environmental Preset in the Scene settings
    twinMakerScene.setEnviromentPreset('neutral');

    // If an asset wasn't uploaded in this script then get the asset name from the asset metadata
    if (assetName.length == 0 && !!cesiumAssetId) {
      const cesiumClient: CesiumClient = new CesiumClient();
      const assetMetadata = await cesiumClient.getAsset(cesiumAccessToken, cesiumAssetId);
      const assetJson = JSON.parse(assetMetadata.toString());
      assetName = assetJson.name;
    }

    if (!!cesiumAssetId) {
      // Add Tiles to the Scene
      const tilesetPath = `${assetName}-${cesiumAssetId}/tileset.json`;
      const tileNode = new ModelRefNode(assetName, tilesetPath, 'Tiles3D');
      tileNode.uploadModelFromCesium(cesiumAssetId);

      twinMakerScene.addRootNodeIfNameNotExist(tileNode);

      // Save the changes to the Scene
      await factory.save(twinMakerScene, cesiumAccessToken);
    } else {
      console.log('Missing Cesium asset ID');
    }
  }
});
