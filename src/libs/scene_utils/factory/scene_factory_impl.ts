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
import { CesiumClient } from '../client/cesium';
import pLimit from 'p-limit';
import { logProgress } from '../utils/file_utils';

const limit = pLimit(10);

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

  public async save(iotTwinMakerScene: IotTwinMakerScene, cesiumAccessToken?: string) {
    iotTwinMakerScene.selfCheck();
    const bucketName = await SceneFactoryImpl.iotTwinMaker.getWorkspaceBucketName(iotTwinMakerScene.getWorkspaceId());
    await this.uploadModelFilesIfNeeded(iotTwinMakerScene, bucketName, cesiumAccessToken);
    console.log(`Saving scene ${iotTwinMakerScene.getSceneId()}...`);
    await SceneFactoryImpl.s3Client.uploadScene(
      bucketName,
      iotTwinMakerScene.getSceneId(),
      this.serializer.serializeScene(iotTwinMakerScene as IotTwinMakerSceneImpl),
    );
    console.log('Scene saved!');
  }

  private async uploadModelFilesIfNeeded(
    iotTwinMakerScene: IotTwinMakerScene,
    bucketName: string,
    cesiumAccessToken?: string,
  ): Promise<void> {
    const modelRefNodes: SceneNode[] = iotTwinMakerScene.findAllNodesByType(MODEL_REF_TYPE);
    for (var node of modelRefNodes) {
      const modelRefNode = node as ModelRefNode;

      const shouldUpload = modelRefNode.needUploadModel;
      const shouldOverride = modelRefNode.overrideModel;
      for (var component of node.getComponents()) {
        if (component.type === MODEL_REF_TYPE) {
          const modelRefComponent = component as ModelRef;
          const exist: boolean = await SceneFactoryImpl.s3Client.doesFileExist(
            bucketName,
            modelRefComponent.modelFileName,
          );

          // Upload files to S3 if indicated
          if ((exist && shouldOverride && shouldUpload) || (!exist && shouldUpload)) {
            if (modelRefComponent.modelType === 'Tiles3D' && cesiumAccessToken) {
              await this.uploadCesiumTilesToS3(bucketName, cesiumAccessToken, modelRefNode.cesiumAssetId);
            } else {
              await SceneFactoryImpl.s3Client.uploadModelRelatedFiles(bucketName, modelRefNode.modelLocalDirectoryPath);
            }
          }
        }
      }
    }
  }

  public async overrideSave(iotTwinMakerScene: IotTwinMakerSceneImpl) {
    iotTwinMakerScene.selfCheck();
    const bucketName = await SceneFactoryImpl.iotTwinMaker.getWorkspaceBucketName(iotTwinMakerScene.workspaceId);
    this.uploadModelFilesIfNeeded(iotTwinMakerScene, bucketName);
    SceneFactoryImpl.s3Client.uploadScene(
      bucketName,
      iotTwinMakerScene.sceneId,
      this.serializer.serializeScene(iotTwinMakerScene),
    );
  }

  public async updateSceneForEntities(
    workspaceId: string,
    callback: (entitySummary: EntitySummary) => void,
    filters?: ListEntitiesFilters,
  ) {
    const entitySummaries = await SceneFactoryImpl.iotTwinMaker.listEntities(workspaceId, filters);
    entitySummaries.forEach(callback);
  }

  private async uploadCesiumTilesToS3(bucketName: string, accessToken: string, assetId: string) {
    console.log(`Uploading tiles to S3 for Cesium asset ID ${assetId}...`);
    const cesiumClient: CesiumClient = new CesiumClient(bucketName);
    const assetMetadata = await cesiumClient.getAsset(accessToken, assetId);
    const assetJson = JSON.parse(assetMetadata.toString());
    const assetName = assetJson.name;
    const outputPath = `${assetName}-${assetId}`;

    // Get access to tileset
    const data = await cesiumClient.download(
      accessToken,
      `https://api.cesium.com/v1/assets/${assetId}/endpoint`,
      false,
    );

    const jsonEndpoint = JSON.parse(data.toString());
    const jsonAccessToken = jsonEndpoint.accessToken;
    // Get tileset info
    const assetData = await cesiumClient.download(jsonAccessToken, jsonEndpoint.url, true);

    const jsonData = JSON.parse(assetData.toString());
    await cesiumClient.writeJsonToFile(jsonData, `${outputPath}/tileset.json`);

    const assetUris = cesiumClient.getAssetUris(jsonData);

    // Upload asset related content (assume all of them are gzipped and in binary format after de-compressed)
    const promises = assetUris.map((assetUri: string) => {
      return limit(async () => {
        logProgress(`processing ${assetUri}`);
        const url = `https://assets.cesium.com/${assetId}/${assetUri}`;
        const data = await cesiumClient.download(jsonAccessToken, url, true);
        const assetOutputPath = `${outputPath}/${assetUri}`;
        await cesiumClient.writeBinaryToFile(data, assetOutputPath);
        await cesiumClient.writeAssetToJsonAndGlb(outputPath, assetUri, data);
        return Promise.resolve();
      });
    });

    await Promise.all(promises);
    process.stdout.clearLine(0);
    console.log(`\nUploaded ${assetUris.length} files to the S3 bucket ${bucketName}`);
  }
}
