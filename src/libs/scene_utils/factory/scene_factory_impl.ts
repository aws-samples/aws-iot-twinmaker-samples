// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2022
// SPDX-License-Identifier: Apache-2.0

import { IotTwinMakerClient } from '../client/iottwinmaker';
import { S3Client } from '../client/s3';
import { SceneFactory } from './scene_factory';
import { IotTwinMakerSceneImpl } from '../scene/iot_twin_maker_scene_impl';
import { Deserializer } from '../utils/deserializer';
import { Serializer } from '../utils/serializer';
import { SceneNode } from '../node/scene_node';
import { ModelRefNode } from '../node/model.ts/model_ref';
import { MODEL_REF_TYPE } from '../components/component_type';
import { ModelRef } from '../components/model_ref_component';
import { IotTwinMakerScene } from '../scene/iot_twin_maker_scene';
import { EntitySummary, ListEntitiesFilters } from 'aws-sdk/clients/iottwinmaker';
import { withTrailingSlash } from '../utils/file_utils';
import { writeFileSync } from 'fs';

export class SceneFactoryImpl implements SceneFactory {
  private static readonly iotTwinMaker: IotTwinMakerClient = new IotTwinMakerClient();
  private static readonly s3Client: S3Client = new S3Client();

  private readonly deserializer: Deserializer = new Deserializer();
  private readonly serializer: Serializer = new Serializer();

  public async loadOrCreateSceneIfNotExists(workspaceId: string, sceneId: string): Promise<IotTwinMakerSceneImpl> {
    return this.createScene(workspaceId, sceneId).catch((e) => {
      if (e.code === 'ConflictException') {
        console.log('Scene already exists, loading scene...');
        return this.loadScene(workspaceId, sceneId);
      } else {
        throw new Error(e);
      }
    });
  }

  // @internal
  async createLocalEmptyScene(workspaceId: string, sceneId: string): Promise<IotTwinMakerSceneImpl> {
    const bucketName = await SceneFactoryImpl.iotTwinMaker.getWorkspaceBucketName(workspaceId);
    return new IotTwinMakerSceneImpl(workspaceId, sceneId, bucketName);
  }

  public async loadScene(workspaceId: string, sceneId: string): Promise<IotTwinMakerSceneImpl> {
    const bucketName = await SceneFactoryImpl.iotTwinMaker.getWorkspaceBucketName(workspaceId);
    const sceneFileContent: string = await SceneFactoryImpl.s3Client.loadSceneFileFrom(bucketName, sceneId);
    return this.deserializer.deserializeScene(workspaceId, sceneId, sceneFileContent);
  }

  public async createScene(workspaceId: string, sceneId: string): Promise<IotTwinMakerSceneImpl> {
    await SceneFactoryImpl.iotTwinMaker.createScene(workspaceId, sceneId);
    const bucketName = await SceneFactoryImpl.iotTwinMaker.getWorkspaceBucketName(workspaceId);
    const scene = new IotTwinMakerSceneImpl(workspaceId, sceneId, bucketName);
    console.log(`Uploading created scene file to ${bucketName}`);
    await SceneFactoryImpl.s3Client.uploadScene(bucketName, sceneId, this.serializer.serializeScene(scene));
    return scene;
  }

  public async deleteScene(workspaceId: string, sceneId: string) {
    const bucketName = await SceneFactoryImpl.iotTwinMaker.getWorkspaceBucketName(workspaceId);
    console.log(`Deleting scene ${sceneId}...`);
    await SceneFactoryImpl.iotTwinMaker.deleteScene(workspaceId, sceneId);
    await SceneFactoryImpl.s3Client.deleteScene(bucketName, sceneId);
    console.log('Scene deleted!');
  }

  public async save(iotTwinMakerScene: IotTwinMakerScene) {
    iotTwinMakerScene.selfCheck();
    const bucketName = await SceneFactoryImpl.iotTwinMaker.getWorkspaceBucketName(iotTwinMakerScene.getWorkspaceId());
    await this.uploadModelFilesIfNeeded(iotTwinMakerScene, bucketName);

    console.log(`Saving scene ${iotTwinMakerScene.getSceneId()}...`);
    await SceneFactoryImpl.s3Client.uploadScene(
      bucketName,
      iotTwinMakerScene.getSceneId(),
      this.serializer.serializeScene(iotTwinMakerScene as IotTwinMakerSceneImpl),
    );
    console.log('Scene saved!');
  }

  public saveLocal(iotTwinMakerScene: IotTwinMakerScene, localPath: string = process.cwd()) {
    iotTwinMakerScene.selfCheck();
    const sceneId = iotTwinMakerScene.getSceneId();

    const sceneFile = `${withTrailingSlash(localPath)}${sceneId}.json`;
    const sceneJson = this.serializer.serializeScene(iotTwinMakerScene as IotTwinMakerSceneImpl);
    // Write scene JSON to the provided localPath
    writeFileSync(sceneFile, sceneJson);
    console.log(`${sceneId}.json saved to ${localPath}`);
  }

  private async uploadModelFilesIfNeeded(
    iotTwinMakerScene: IotTwinMakerScene,
    bucketName: string,
  ): Promise<void> {
    const modelRefNodes: SceneNode[] = iotTwinMakerScene.findAllNodesByType(MODEL_REF_TYPE);
    for (const node of modelRefNodes) {
      const modelRefNode = node as ModelRefNode;

      const shouldUpload = modelRefNode.needUploadModel;
      const shouldOverride = modelRefNode.overrideModel;
      for (const component of node.getComponents()) {
        if (component.type === MODEL_REF_TYPE) {
          const modelRefComponent = component as ModelRef;
          const exist: boolean = await SceneFactoryImpl.s3Client.doesFileExist(
            bucketName,
            modelRefComponent.modelFileName,
          );

          // Upload files to S3 if indicated
          if ((exist && shouldOverride && shouldUpload) || (!exist && shouldUpload)) {
            await SceneFactoryImpl.s3Client.uploadModelRelatedFiles(bucketName, modelRefNode.modelLocalPath);
          } else if (shouldUpload && exist && !shouldOverride) {
            console.log(`File already exists in S3: ${modelRefComponent.modelFileName}`);
          } else if (!shouldUpload && !exist) {
            throw new Error(`File does not exist in S3 ${modelRefComponent.modelFileName}`);
          }
        }
      }
    }
  }

  public async updateSceneForEntities(
    workspaceId: string,
    callback: (entitySummary: EntitySummary) => void,
    filters?: ListEntitiesFilters,
  ) {
    const entitySummaries = await SceneFactoryImpl.iotTwinMaker.listEntities(workspaceId, filters);
    entitySummaries.forEach(callback);
  }
}
