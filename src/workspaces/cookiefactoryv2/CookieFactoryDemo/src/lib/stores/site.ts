// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { ListEntitiesCommand, type EntitySummary } from '@aws-sdk/client-iottwinmaker';
import { initialize } from '@iot-app-kit/source-iottwinmaker';

import { createStore, createStoreHook } from '@/lib/core/store';
import { resetDataStores } from '@/lib/stores/data';
import { resetEntityStores, summaryStore } from '@/lib/stores/entity';
import { resetHierarchyStore } from '@/lib/stores/hierarchy';
import { clientStore, dataSourceStore, sceneLoaderStore } from '@/lib/stores/iottwinmaker';
import { resetPanelsStore } from '@/lib/stores/panels';
import { userStore } from '@/lib/stores/user';
import { viewStore } from '@/lib/stores/view';
import type { Site } from '@/lib/types';

export const siteStore = createStore<Site | null>(null);

export const useSiteStore = createStoreHook(siteStore);

// private subscriptions

siteStore.subscribe(async (getState) => {
  const client = clientStore.getState();
  const user = userStore.getState();
  const site = getState();

  dataSourceStore.setState(null);
  sceneLoaderStore.setState(null);
  viewStore.setState('panel');
  resetDataStores();
  resetEntityStores();
  resetHierarchyStore();
  resetPanelsStore();

  if (site) {
    if (user) {
      const dataSource = initialize(site.iottwinmaker.workspaceId, {
        awsCredentials: user.awsCredentials!,
        awsRegion: user.awsCredentials!.region
      });

      dataSourceStore.setState(dataSource);
      sceneLoaderStore.setState(dataSource.s3SceneLoader(site.iottwinmaker.sceneId));
      // alarmHistoryQueriesStore.setState(defaultAlarmStateHistoryQuery);
      // dataHistoryQueriesStore.setState(defaultDataHistoryQuery);
    }

    if (client && Object.keys(summaryStore.getState()).length === 0) {
      const workspaceCommand = new ListEntitiesCommand({
        maxResults: 200,
        workspaceId: site.iottwinmaker.workspaceId
      });

      const { entitySummaries } = await client.send(workspaceCommand);

      if (entitySummaries) {
        summaryStore.setState(
          entitySummaries.reduce<Record<string, EntitySummary>>((accum, entity) => {
            if (entity.entityId) {
              accum[entity.entityId] = entity;
            }
            return accum;
          }, {})
        );
      }
    }
  }
});
