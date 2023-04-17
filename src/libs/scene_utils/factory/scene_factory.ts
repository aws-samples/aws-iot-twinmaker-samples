// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2022
// SPDX-License-Identifier: Apache-2.0

import { EntitySummary, ListEntitiesFilters } from 'aws-sdk/clients/iottwinmaker';
import { IotTwinMakerScene } from '../scene/iot_twin_maker_scene';
import { IotTwinMakerSceneImpl } from '../scene/iot_twin_maker_scene_impl';

export interface SceneFactory {
  /**
   * A method to create scene if the scene does not exist, or load the scene
   * if the scene already exists in the workspace specified by workspaceId.
   * A promise of IotTwinMakerScene will be returned.
   *
   * @thrown ResourceNotFoundException if the workspace or scene do not exist.
   */
  loadOrCreateSceneIfNotExists(workspaceId: string, sceneId: string): Promise<IotTwinMakerSceneImpl>;

  /**
   * Load the existing scene. A promise of IotTwinMakerScene will be returned.
   *
   * @thrown ResourceNotFoundException if the workspace or scene do not exist.
   */
  loadScene(workspaceId: string, sceneId: string): Promise<IotTwinMakerSceneImpl>;

  /**
   * Create a new scene. A promise of IotTwinMakerScene will be returned.
   *
   * @thrown ResourceNotFoundException error when the workspace does not exist.
   * @thrown SceneAlreadyExists error when the scene already exists.
   */
  createScene(workspaceId: string, sceneId: string): Promise<IotTwinMakerSceneImpl>;

  /**
   * Save the scene by uploading the scene JSON to S3. Will override the scene
   * if it already exists.
   *
   * @param iotTwinMakerScene is the scene stored in memory to save in S3
   *
   * @thrown SceneHasBeenModifed error when the scene has been modified by someone else.
   */
  save(iotTwinMakerScene: IotTwinMakerScene): void;

  /**
   * Save the scene JSON locally to @param localPath
   *
   * @thrown SceneHasBeenModifed error when the scene has been modified by someone else.
   */
  saveLocal(iotTwinMakerScene: IotTwinMakerScene, localPath: string): void;

  /**
   * Update the scene based on the workspace's list of entities. IoTTwinMaker.ListEntities
   * is called with the provided filters. The callback function is then called on each
   * entity in the resulting list.
   * @param workspaceId
   * @param callback function called on each entity returned by ListEntities
   * @param filters filter for the ListEntities request
   */
  updateSceneForEntities(
    workspaceId: string,
    callback: (entitySummary: EntitySummary) => void,
    filters?: ListEntitiesFilters,
  ): void;
}
