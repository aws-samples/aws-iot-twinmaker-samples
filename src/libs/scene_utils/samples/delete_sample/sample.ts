// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2022
// SPDX-License-Identifier: Apache-2.0

import { SceneFactoryImpl } from '../../factory/scene_factory_impl';
import { parseArgs } from './sample_utils';

const args = parseArgs();
const deleteAll = args.deleteAll;

const factory = new SceneFactoryImpl();

if (deleteAll) {
  factory.deleteScene(args.workspaceId, args.sceneId);
} else {
  // Load an existing scene for updates
  factory.loadScene(args.workspaceId, args.sceneId).then((twinMakerScene) => {
    // Find and delete all nodes
    const targetNodes = twinMakerScene.getRootNodes();
    for (var nodeToBeDeleted of targetNodes) {
      twinMakerScene.deleteNode(nodeToBeDeleted);
      console.log('Deleted root node: ', nodeToBeDeleted.name);
    }

    factory.save(twinMakerScene);
  });
}
