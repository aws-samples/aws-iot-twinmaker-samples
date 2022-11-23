// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2022
// SPDX-License-Identifier: Apache-2.0

import { CesiumClient } from '../../client/cesium';
import { SceneFactoryImpl } from '../../factory/scene_factory_impl';
import { ModelRefNode } from '../../node/model.ts/model_ref';
import { parseArgs } from './sample_utils';
import { GeometryCompression } from '../../cesium/types';
import { basename } from 'path';

const { workspaceId, sceneId, assetFilePath, cesiumAccessToken, cesiumAssetId, dracoCompression } = parseArgs();
let assetId = cesiumAssetId;
let assetName = '';

const factory = new SceneFactoryImpl();

// Create a scene or load an existing scene for updates
factory.loadOrCreateSceneIfNotExists(workspaceId, sceneId).then(async (twinMakerScene) => {
  // Wait for a tiled asset - if there's no path then assume tiling is done
  let tilingDone = assetFilePath === '';

  const cesiumClient: CesiumClient = new CesiumClient();

  if (!!assetFilePath) {
    // If requested, upload an asset to Cesium
    const fileName = basename(assetFilePath);
    const fileNameSplit = fileName.split('.');
    assetName = !!fileNameSplit ? fileNameSplit[0] : '';

    console.log('Uploading asset to Cesium Ion...');
    // Submit asset upload request
    const description = 'Asset to be visualized in AWS IoT TwinMaker';
    const compression: GeometryCompression = dracoCompression === true ? 'DRACO' : 'NONE';
    [assetId, tilingDone] = await cesiumClient.upload(cesiumAccessToken, assetFilePath, description, compression);
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