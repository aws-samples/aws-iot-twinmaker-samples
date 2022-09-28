// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2022
// SPDX-License-Identifier: Apache-2.0

import { IoTTwinMaker } from 'aws-sdk';
import {
  CreateSceneRequest,
  GetWorkspaceRequest,
  EntitySummaries,
  ListEntitiesFilters,
  ListEntitiesRequest,
  DeleteSceneRequest,
} from 'aws-sdk/clients/iottwinmaker';

export class IotTwinMakerClient {
  private twinmakerClient: IoTTwinMaker;

  constructor() {
    this.twinmakerClient = new IoTTwinMaker();
  }

  public async createScene(workspaceId: string, sceneId: string): Promise<void> {
    const bucketName = await this.getWorkspaceBucketName(workspaceId);
    const locationPath = `s3://${bucketName}/${sceneId}.json`;
    const request: CreateSceneRequest = {
      contentLocation: locationPath,
      sceneId,
      workspaceId,
    };

    await this.twinmakerClient.createScene(request).promise();
  }

  public createSceneIfNotExist(workspaceId: string, sceneId: string): void {
    this.createScene(workspaceId, sceneId);
  }

  public async deleteScene(workspaceId: string, sceneId: string): Promise<void> {
    const request: DeleteSceneRequest = {
      sceneId,
      workspaceId,
    };

    await this.twinmakerClient.deleteScene(request).promise();
  }

  public async getWorkspaceBucketName(workspaceId: string): Promise<string> {
    const getWorkspaceResquest: GetWorkspaceRequest = {
      workspaceId,
    };

    const getWorkspaceResponse = await this.twinmakerClient.getWorkspace(getWorkspaceResquest).promise();

    const segments = getWorkspaceResponse.s3Location.split(':');
    return segments[segments.length - 1];
  }

  public async listEntities(workspaceId: string, filters?: ListEntitiesFilters): Promise<EntitySummaries> {
    const listEntitiesRequest: ListEntitiesRequest = {
      workspaceId,
      filters,
    };

    let entitySummaries: EntitySummaries = [];
    let nextToken: string | undefined = '';

    while (nextToken !== undefined) {
      const listEntitiesResponse = await this.twinmakerClient.listEntities(listEntitiesRequest).promise();
      if (listEntitiesResponse.entitySummaries) {
        entitySummaries = entitySummaries.concat(listEntitiesResponse.entitySummaries);
      }
      nextToken = listEntitiesResponse.nextToken;
    }

    return entitySummaries;
  }
}
