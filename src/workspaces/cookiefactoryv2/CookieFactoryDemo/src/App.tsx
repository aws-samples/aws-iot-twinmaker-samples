// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import { IoTTwinMakerClient, ListEntitiesCommand, type EntitySummary } from '@aws-sdk/client-iottwinmaker';
import { WebglContext } from '@iot-app-kit/react-components';
import { initialize } from '@iot-app-kit/source-iottwinmaker';
import { useEffect } from 'react';

import { DEFAULT_PANEL_ID, SDK_CUSTOM_USER_AGENT } from '@/config/iottwinmaker';
import { AppView, PersonaSelectorView, SiteSelectorView } from '@/lib/components/views';
import { DEFAULT_SELECTED_ENTITY } from '@/lib/entities';
import { selectedState, summaryState } from '@/lib/state/entity';
import { hierarchyState } from '@/lib/state/hierarchy';
import { panelState, usePanelState } from '@/lib/state/panel';
import { siteState, useSiteState } from '@/lib/state/site';
import { clientState, dataSourceState, sceneLoaderState } from '@/lib/state/twinMaker';
import { userState, useUserState } from '@/lib/state/user';
import { viewState } from '@/lib/state/view';
import { isNil } from '@/lib/utils/lang';

import styles from './app.module.css';
import { createClassName } from './lib/utils/element';

export function App() {
  const [panels] = usePanelState();
  const [site] = useSiteState();
  const [user] = useUserState();

  useEffect(() => {
    if (!panels.includes('dashboard')) {
      document.body.classList.add('hide-appkit');
    } else {
      document.body.classList.remove('hide-appkit');
    }
  }, [panels]);

  useEffect(() => {
    const unsubscribeSite = siteState.subscribe(async (getState) => {
      const client = clientState.getState();
      const user = userState.getState();
      const site = getState();

      dataSourceState.setState(null);
      hierarchyState.setState(null);
      panelState.setState(DEFAULT_PANEL_ID ? [DEFAULT_PANEL_ID] : []);
      sceneLoaderState.setState(null);
      selectedState.setState(DEFAULT_SELECTED_ENTITY);
      viewState.setState('panel');

      if (site) {
        if (user) {
          const dataSource = initialize(site.awsConfig.workspaceId, {
            awsCredentials: user.awsCredentials!,
            awsRegion: user.awsCredentials!.region
          });

          dataSourceState.setState(dataSource);
          sceneLoaderState.setState(dataSource.s3SceneLoader(site.awsConfig.sceneId));
        }

        if (client && Object.keys(summaryState.getState()).length === 0) {
          const workspaceCommand = new ListEntitiesCommand({
            maxResults: 200,
            workspaceId: site.awsConfig.workspaceId
          });

          const { entitySummaries } = await client.send(workspaceCommand);

          if (entitySummaries) {
            summaryState.setState(
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

    const unsubscribeUser = userState.subscribe((getState) => {
      const state = getState();

      if (state) {
        clientState.setState(
          new IoTTwinMakerClient({
            credentials: state.awsCredentials,
            customUserAgent: SDK_CUSTOM_USER_AGENT,
            region: state.awsCredentials!.region
          })
        );
      } else {
        const client = clientState.getState();

        if (client) {
          client.destroy();
          clientState.setState(null);
        }

        siteState.setState(null);
      }
    });

    return () => {
      unsubscribeSite();
      unsubscribeUser();
    };
  }, []);

  return (
    <>
      <main className={styles.root}>
        {isNil(user) ? <PersonaSelectorView /> : isNil(site) ? <SiteSelectorView /> : <AppView />}
      </main>
      <WebglContext className={createClassName({ [styles.canvasHidden]: !panels.includes('dashboard') })} />
    </>
  );
}
