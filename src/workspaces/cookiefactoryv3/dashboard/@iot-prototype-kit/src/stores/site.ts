// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { ExecuteQueryCommand, type Row } from '@aws-sdk/client-iottwinmaker';
import { initialize } from '@iot-app-kit/source-iottwinmaker';

import { action, atom } from '@iot-prototype-kit/core/store';
import { chunk, isEmpty, isNil } from '@iot-prototype-kit/core/utils/lang2';
import { injectCssVars } from '@iot-prototype-kit/core/utils/styles';
import { resetAlarmValues, resetDataStreams, resetEntitiesLatestValues } from '@iot-prototype-kit/stores/data';
import { $entities, resetEntities, resetSelectedEntity, setEntities } from '@iot-prototype-kit/stores/entity';
import {
  $activeCamera,
  $client,
  $dataSource,
  $sceneLoader,
  $sceneMetadataModule,
  resetActiveCamera,
  resetDataSource,
  resetSceneLoader,
  resetSceneMetadataModule
} from '@iot-prototype-kit/stores/iottwinmaker';
import { resetOpenPanels, resetPanelConfigs } from '@iot-prototype-kit/stores/panel';
import { $user } from '@iot-prototype-kit/stores/user';
import type { Site, TwinMakerQueryNodeData, IoTTwinMakerClient, SiteConfig } from '@iot-prototype-kit/types';

import { createQueryFor } from '@iot-prototype-kit/utils/queries';

type QureryRows = {
  rowData: TwinMakerQueryNodeData[];
}[];

export const $site = atom<Site | null>(null);

export const resetSite = action($site, 'resetSite', ({ set }) => set(null));
export const setSite = action($site, 'setSite', ({ set }, config: SiteConfig) => set({ ...config }));

$site.listen(async (site) => {
  const client = $client.get();
  const user = $user.get();

  // reset iottwinmaker stores
  resetActiveCamera(), resetDataSource(), resetSceneLoader(), resetSceneMetadataModule();
  // reset data stores
  resetAlarmValues(), resetDataStreams(), resetEntitiesLatestValues();
  // reset entity stores
  resetEntities(), resetSelectedEntity();
  // reset panel stores
  resetOpenPanels(), resetPanelConfigs();

  if (site) {
    const visualizationConfig = site.aws.iot.appkit?.visualization;

    let cssVars: Record<string, string> = {};

    if (visualizationConfig?.alarms) {
      Object.values(visualizationConfig.alarms).reduce((accum, thing) => {
        accum[`color-alarm-${thing.value.toLocaleLowerCase()}`] = thing.color;
        return accum;
      }, cssVars);
    }

    if (visualizationConfig?.data) {
      visualizationConfig.data.reduce((accum, thing) => {
        accum[`color-chart-${thing.id.toLocaleLowerCase()}`] = thing.color;
        return accum;
      }, cssVars);
    }

    if (!isEmpty(cssVars)) injectCssVars(cssVars);

    const twinMakerConfig = site.aws.iot.twinMaker;

    if (twinMakerConfig) {
      const { cameras, entityConfigs, sceneId, workspaceId } = twinMakerConfig;

      const selectedCamera = cameras?.find(({ isSelected }) => isSelected === true);
      $activeCamera.set(selectedCamera ?? site.aws.iot.appkit?.sceneViewer?.activeCamera ?? null);

      if (user) {
        const dataSource = initialize(workspaceId, {
          awsCredentials: user.awsCredentials!,
          awsRegion: user.awsCredentials!.region
        });

        $dataSource.set(dataSource);
        $sceneLoader.set(dataSource.s3SceneLoader(sceneId));
        $sceneMetadataModule.set(dataSource.sceneMetadataModule(sceneId));

        if (client) {
          const entityIds = entityConfigs.map((entity) => entity.entityId);

          if (entityIds.length) {
            const rows = await executeQueryCommand(client, workspaceId, ...entityIds);

            if (rows) {
              const entities = $entities.get();

              for (const { rowData } of rows as QureryRows) {
                for (const { entityId, entityName } of rowData) {
                  const entityConfig = entityConfigs.find((entity) => entity.entityId === entityId);

                  if (entityConfig) {
                    let component = entityConfig.component;

                    if (isNil(component)) {
                      component =
                        entityConfig.video?.componentName !== undefined
                          ? { componentName: entityConfig.video.componentName! }
                          : component;
                    }

                    entities[entityId] = {
                      component,
                      entityId,
                      images: entityConfig.images,
                      isRoot: entityConfig.isRoot,
                      metadata: {
                        displayName: entityConfig.metadata?.displayName ?? entityName,
                        description: entityConfig.metadata?.description
                      },
                      video: entityConfig.video,
                      visualization: entityConfig.visualization
                    };
                  }
                }
              }

              setEntities(entities);
            }
          }
        }
      }
    }
  }
});

async function executeQueryCommand(client: IoTTwinMakerClient, workspaceId: string, ...entityIds: string[]) {
  const _rows: Row[] = [];

  /**
   * Chunk requests to solve for `ServiceQuotaExceededException: Invalid PartiQL statement. Max number of
   * supported AND, OR and NOT is 10.`
   */
  const entityIdChunks = chunk(entityIds, 10);

  for (const chunk of entityIdChunks) {
    const queryStatement = createQueryFor(...chunk);
    const command = new ExecuteQueryCommand({ queryStatement, workspaceId });
    const { rows } = await client.send(command);
    if (rows) _rows.push(...rows);
  }

  return _rows;
}
