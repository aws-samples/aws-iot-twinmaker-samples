// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { UpdateEntityCommand } from '@aws-sdk/client-iottwinmaker';
import { type PointerEvent, useEffect, useMemo, useState } from 'react';

import { Clock } from '@iot-prototype-kit/components/layouts/HeaderLayout/components/Clock';
import { SiteMenu } from '@iot-prototype-kit/components/layouts/HeaderLayout/components/SiteMenu';
import { UserMenu } from '@iot-prototype-kit/components/layouts/HeaderLayout/components/UserMenu';
import { CloseIcon } from '@iot-prototype-kit/components/svgs/icons/CloseIcon';
import { useStore } from '@iot-prototype-kit/core/store';
import { createClassName, type ComponentProps } from '@iot-prototype-kit/core/utils/element';
import { generateItems, isEmpty } from '@iot-prototype-kit/core/utils/lang2';
import { compareStrings } from '@iot-prototype-kit/core/utils/string';
import { useGraphViewer } from '@iot-prototype-kit/hooks/useGraphViewer';
import { useScenePortals } from '@iot-prototype-kit/hooks/useScenePortals';
import { useSceneViewer } from '@iot-prototype-kit/hooks/useSceneViewer';
import { TimeSeriesData } from '@iot-prototype-kit/providers/TimeSeriesData';
import { $alarmValues, $dataStreams } from '@iot-prototype-kit/stores/data';
import { $entities, $entityHistoryQueries, $selectedEntity } from '@iot-prototype-kit/stores/entity';
import { $client } from '@iot-prototype-kit/stores/iottwinmaker';
import { $openPanels, togglePanel } from '@iot-prototype-kit/stores/panel';
import { $site } from '@iot-prototype-kit/stores/site';
import type { DataStreamMetaData, PanelConfig } from '@iot-prototype-kit/types';
import type { EntityDataProperty } from '@iot-prototype-kit/types';
import { getAppKitConfig, getTwinMakerConfig } from '@iot-prototype-kit/utils/config';
import { getAlarmByValue } from '@iot-prototype-kit/utils/data';

import {
  dashboardPanelId,
  processPanelId,
  scenePanelId,
  simulationTriggerConfig,
  triggerEventData
} from '@/app.config';
import { SceneOverlay } from '@/lib/components/panels/scene/SceneOverlay';
import { CookieFactoryLogoWide } from '@/lib/components/svgs/logos/CookieFactoryLogo';
import type { AppAlarmState, AppAlarms } from '@/lib/types';

import { GenAiView } from './components/GenAiView';
import { LineChart } from './components/charts/LineChart';
import { StatusTimeline } from './components/charts/StatusTimeline';

import styles from './styles.module.scss';

export function PaneView({
  children,
  className,
  panelConfigs,
  ...props
}: ComponentProps<{ panelConfigs: PanelConfig[] }>) {
  const alarmValues = useStore($alarmValues);
  const entityHistoryQueries = useStore($entityHistoryQueries);
  const selectedEntity = useStore($selectedEntity);
  const site = useStore($site);
  const openPanels = useStore($openPanels);

  const { graphViewer } = useGraphViewer(processPanelId);

  const { portals, portalsContainerRef } = useScenePortals({
    overlayRenderCallback: (props) => <SceneOverlay {...props} />
  });

  const { sceneViewer } = useSceneViewer(scenePanelId, {
    appKitConfig: getAppKitConfig(),
    twinMakerConfig: getTwinMakerConfig()
  });

  const [processPanelIsVisible, setProcessPanelIsVisible] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isBlurred, setIsBlurred] = useState(false);

  const images = useMemo(() => {
    if (isEmpty(selectedEntity.entity?.images)) return null;

    const imageElements = selectedEntity.entity!.images.map((image) => {
      return <div data-image style={{ backgroundImage: `url(${image})` }} key={image} />;
    });

    return (
      <section data-viz-item data-viz-images>
        <section data-head>
          <div data-label>Latest Product Captures</div>
        </section>
        <section data-images>{imageElements}</section>
      </section>
    );
  }, [selectedEntity]);

  const lineCharts = useMemo(() => {
    if (selectedEntity.entity) {
      const entity = $entities.get()[selectedEntity.entity.entityId];

      if (entity) {
        const properties = entity.component?.properties;

        if (properties) {
          const colors = generateItems(getAppKitConfig()?.visualization?.data ?? []);

          return properties
            .filter(({ type }) => type === 'data')
            .sort((a, b) =>
              compareStrings(
                a.displayName ?? a.propertyQueryInfo.propertyName,
                b.displayName ?? b.propertyQueryInfo.propertyName
              )
            )
            .map((property) => (
              <DataViz
                color={colors.next().value?.color}
                data-viz-item
                data-viz-line-chart
                entityId={entity.entityId}
                key={entity.entityId + property.propertyQueryInfo.propertyName}
                property={property}
              />
            ));
        }
      }
    }

    return null;
  }, [selectedEntity]);

  const statusTimelines = useMemo(() => {
    if (selectedEntity.entity) {
      const entity = $entities.get()[selectedEntity.entity.entityId];

      if (entity) {
        const properties = entity.component?.properties;

        if (properties) {
          var ret = properties
            .filter(({ type }) => type === 'alarm-state')
            .sort((a, b) =>
              compareStrings(
                a.displayName ?? a.propertyQueryInfo.propertyName,
                b.displayName ?? b.propertyQueryInfo.propertyName
              )
            )

            .sort((a, b) =>
              compareStrings(
                a.displayName ?? a.propertyQueryInfo.propertyName,
                b.displayName ?? b.propertyQueryInfo.propertyName
              )
            )
            .map((property) => (
              <DataViz2
                data-viz-item
                data-viz-status-timeline
                entityId={entity.entityId}
                key={entity.entityId + property.propertyQueryInfo.propertyName}
                property={property}
              />
            ));
          return ret;
        }
      }
    }

    return null;
  }, [selectedEntity]);

  useEffect(() => {
    setProcessPanelIsVisible((state) => {
      if (!state && openPanels.has(dashboardPanelId)) return true;
      return state;
    });
  }, [openPanels]);

  return (
    <>
      <main className={createClassName(styles.root, className)} {...props}>
        <section data-panes data-is-collapsed={isCollapsed}>
          {isCollapsed && <Chrome />}
          <section data-pane-primary>
            {!isCollapsed && (
              <Chrome
                handleSimulationClick={() => {
                  setSimulationFlag(true);
                  setIsBlurred(true);
                }}
              />
            )}
            {selectedEntity.entity?.metadata.displayName && (
              <section
                data-entity-name
                data-alarm={getAlarmByValue<AppAlarmState>(
                  alarmValues[selectedEntity.entity?.entityId ?? '']?.dataPoint.y
                )}
              >
                {selectedEntity.entity?.metadata.displayName ?? site?.name ?? 'Site'}
              </section>
            )}
            <div data-scene ref={portalsContainerRef}>
              {portals}
              {sceneViewer}
            </div>
            <section data-panels>
              {openPanels.has(processPanelId) && (
                <div
                  data-panel
                  data-process
                  onAnimationEnd={({ animationName, target }) => {
                    if (animationName === styles.fadeIn) {
                      const isProcessPanel = (target as HTMLElement).getAttribute('data-process');
                      if (isProcessPanel) setProcessPanelIsVisible(true);
                    }
                  }}
                >
                  <div data-panel-header>
                    <div data-panel-name>
                      {panelConfigs.find(({ id }) => id === processPanelId)?.button.label ?? 'Unknown'}
                    </div>
                    <div data-panel-controls>
                      <CloseButton id={processPanelId} />
                    </div>
                  </div>
                  {processPanelIsVisible && graphViewer}
                </div>
              )}
              {openPanels.has(dashboardPanelId) && (
                <div data-panel data-dashboard>
                  <div data-panel-header>
                    <div data-panel-name>
                      {panelConfigs.find(({ id }) => id === dashboardPanelId)?.button.label ?? 'Unknown'}
                    </div>
                    <div data-panel-controls>
                      <CloseButton id={dashboardPanelId} />
                    </div>
                  </div>
                  {statusTimelines || lineCharts || images ? (
                    <div data-viz>
                      {statusTimelines}
                      {images}
                      {lineCharts}
                    </div>
                  ) : (
                    <div data-empty-state>
                      <div data-title>You&#8217;re all caught up!</div>
                      <div data-message>No data available</div>
                    </div>
                  )}
                </div>
              )}
            </section>
            <section data-controls>
              {panelConfigs.map((config) => (
                <PanelButton key={config.id} {...config} />
              ))}
            </section>
          </section>
          <section data-pane-secondary>
            <GenAiView
              onDismiss={() => {
                setSimulationFlag(false);
                setIsCollapsed(false);
              }}
              reset={!isCollapsed}
            />
          </section>
        </section>
        {isBlurred && (
          <section data-flash>
            <section data-flash-bar>
              <section data-flash-info>
                <div data-flash-title>{triggerEventData.event_title}</div>
                <div data-flash-description>
                  <div>Alarm rule: {triggerEventData.event_description}</div>
                  <div>Alarm time: {triggerEventData.event_timestamp}</div>
                </div>
              </section>
              <button
                data-flash-control
                onPointerUp={() => {
                  setIsBlurred(false);
                  setIsCollapsed(true);
                }}
              >
                Acknowledge
              </button>
            </section>
          </section>
        )}
      </main>
      <TimeSeriesData entityHistoryQueries={entityHistoryQueries} />
    </>
  );
}

async function setSimulationFlag(value: boolean) {
  const client = $client.get();
  const twinMakerConfig = getTwinMakerConfig();

  if (client && twinMakerConfig) {
    const { componentTypeId, entityId } = simulationTriggerConfig;
    const { workspaceId } = twinMakerConfig;

    const command = new UpdateEntityCommand({
      componentUpdates: {
        synthetics: {
          componentTypeId,
          updateType: 'UPDATE',
          propertyUpdates: {
            generate_error_states: {
              value: {
                booleanValue: value
              }
            }
          }
        }
      },
      entityId,
      workspaceId
    });

    await client.send(command);
  }
}

function Chrome({ handleSimulationClick }: { handleSimulationClick?: () => void }) {
  return (
    <main className={createClassName(styles.chrome)}>
      <div data-logo>
        <CookieFactoryLogoWide />
      </div>
      <SiteMenu />
      <button data-button data-is-locked={!handleSimulationClick} onPointerUp={handleSimulationClick}>
        Run event simulation
      </button>
      <Clock />
      <UserMenu />
    </main>
  );
}

function DataViz({
  children,
  className,
  color,
  entityId,
  property: {
    displayName,
    propertyQueryInfo: { propertyName },
    unit
  },
  ...props
}: ComponentProps<{
  color?: string;
  entityId: string;
  property: EntityDataProperty;
}>) {
  const dataStreams = useStore($dataStreams);

  const dataStream = dataStreams.find(
    ({ meta }) =>
      (meta as DataStreamMetaData)?.entityId === entityId && (meta as DataStreamMetaData)?.propertyName === propertyName
  );
  const viewport = getAppKitConfig()?.timeSeriesData?.viewport;

  return dataStream?.data ? (
    <LineChart
      color={color ?? 'black'}
      dataStream={dataStream}
      label={displayName ?? propertyName}
      unit={unit}
      viewport={viewport}
      {...props}
    />
  ) : null;
}

function DataViz2({
  children,
  className,
  color,
  entityId,
  property: {
    displayName,
    propertyQueryInfo: { propertyName },
    unit
  },
  ...props
}: ComponentProps<{
  color?: string;
  entityId: string;
  property: EntityDataProperty;
}>) {
  const dataStreams = useStore($dataStreams);

  const dataStream = dataStreams.find(
    ({ meta }) =>
      (meta as DataStreamMetaData)?.entityId === entityId && (meta as DataStreamMetaData)?.propertyName === propertyName
  );

  const legend = Object.values(getAppKitConfig()?.visualization?.alarms ?? {})
    .filter(({ showInLegend }) => showInLegend === true)
    .map(({ color, label: { text } }) => {
      return { color, label: text };
    });

  const alarms = getAppKitConfig()?.visualization?.alarms as AppAlarms;
  const viewport = getAppKitConfig()?.timeSeriesData?.viewport;

  var ret = dataStream?.data ? (
    <StatusTimeline
      dataStream={dataStream}
      label={displayName ?? propertyName}
      legend={legend}
      unit={unit}
      viewport={viewport}
      selectColor={(y) => {
        if (alarms) {
          const alarm = alarms[(y as string).toLowerCase() as AppAlarmState];
          return alarm.color ?? 'transparent';
        }
        return 'transparent';
      }}
      {...props}
    />
  ) : null;

  return ret;
}

function PanelButton({ button: { icon, label }, id, onClose }: PanelConfig) {
  const openPanels = useStore($openPanels);

  return (
    <button
      data-panel-button
      data-is-selected={openPanels.has(id)}
      onPointerUp={({ altKey }: PointerEvent<HTMLButtonElement>) => {
        const isOpen = togglePanel(id, altKey);
        if (onClose && !isOpen) onClose();
      }}
    >
      <div data-icon>{icon}</div>
      <div data-label>{label}</div>
    </button>
  );
}

function CloseButton({ id, onClose }: { id: string; onClose?: () => void }) {
  return (
    <button
      data-panel-control
      onPointerUp={() => {
        const isOpen = togglePanel(id);
        if (onClose && !isOpen) onClose();
      }}
    >
      <CloseIcon />
    </button>
  );
}
