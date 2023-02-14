// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2022
// SPDX-License-Identifier: Apache-2.0

import { SceneFactoryImpl } from '../../factory/scene_factory_impl';
import { ModelRefNode } from '../../node/model.ts/model_ref';
import { parseArgsTilesToScene } from './sample_utils';

const { workspaceId, sceneId, tilesName } = parseArgsTilesToScene();

const factory = new SceneFactoryImpl();

// Create a scene or load an existing scene for updates
factory.loadOrCreateSceneIfNotExists(workspaceId, sceneId).then(async (twinMakerScene) => {
    // Only download Cesium tiles and edit the scene if the tiling on the asset is finished
    // Add a Root Node to the Scene
    console.log('Creating/Editing scene...');

    // Set the Environmental Preset in the Scene settings
    twinMakerScene.setEnviromentPreset('neutral');

    // Add Tiles to the Scene
    const tilesetPath = `${tilesName}/tileset.json`;
    const tileNode = new ModelRefNode(tilesName, tilesetPath, 'Tiles3D');

    twinMakerScene.addRootNodeIfNameNotExist(tileNode);

    // Save the changes to the Scene
    await factory.save(twinMakerScene);
});
