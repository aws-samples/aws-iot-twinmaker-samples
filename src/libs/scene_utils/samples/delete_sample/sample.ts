// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2022
// SPDX-License-Identifier: Apache-2.0

import { SceneFactoryImpl } from '../../factory/scene_factory_impl';
import { parseArgs } from './sample_utils';

const { workspaceId, sceneId, deleteAll } = parseArgs();

const factory = new SceneFactoryImpl();

if (deleteAll) {
  factory.deleteScene(workspaceId, sceneId);
} else {
  // Load an existing scene for updates
  factory.loadScene(workspaceId, sceneId).then((twinMakerScene) => {
    // Find and delete all nodes
    const targetNodes = twinMakerScene.getRootNodes();
    for (const nodeToBeDeleted of targetNodes) {
      twinMakerScene.deleteNode(nodeToBeDeleted);
      console.log('Deleted root node: ', nodeToBeDeleted.name);
    }

    factory.save(twinMakerScene);
  });
}
