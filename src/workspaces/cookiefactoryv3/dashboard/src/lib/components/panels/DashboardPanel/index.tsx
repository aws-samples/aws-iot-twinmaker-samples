// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { TimeSync, WebglContext } from '@iot-app-kit/react-components';
import { useStore } from '@nanostores/react';
import { useMemo, type ReactNode } from 'react';

import { Panel, type PanelProps } from '@iot-prototype-kit/components/Panel';
import { LineChart } from '@iot-prototype-kit/components/charts/LineChart';
import { StatusTimelineChart } from '@iot-prototype-kit/components/charts/StatusTimelineChart';
import { createClassName } from '@iot-prototype-kit/core/utils/element';
import { generateItems, isEmpty, isFunction } from '@iot-prototype-kit/core/utils/lang2';
import { $entityList, $selectedEntity } from '@iot-prototype-kit/stores/entity';
import { $openFlexPanels } from '@iot-prototype-kit/stores/panel';
import type { Entity, StyleSettingsMap } from '@iot-prototype-kit/types';
import { getAppKitConfig } from '@iot-prototype-kit/utils/config';
import { getAlarms } from '@iot-prototype-kit/utils/data';
import { getAllHistoryQueries, getEntityHistoryQueries, isEntityWithProperties } from '@iot-prototype-kit/utils/entity';

import '@iot-app-kit/charts/dist/styles.css';
import styles from './styles.module.css';

type DashboardPanelProps = PanelProps<{
  emptyState: ReactNode | ((entity?: Entity | null) => ReactNode);
}>;

const DEFAULT_DATA_COLOR = 'blue';

export function DashboardPanel({ className, emptyState, ...props }: DashboardPanelProps) {
  const entityList = useStore($entityList);
  const openFlexPanels = useStore($openFlexPanels);
  const selectedEntity = useStore($selectedEntity);
  const appKitConfig = getAppKitConfig();

  const entityAlarmStyles = useMemo(() => {
    return entityList.reduce<StyleSettingsMap>((accum, entityData) => {
      if (isEntityWithProperties(entityData)) {
        const {
          component: { properties },
          metadata: { displayName }
        } = entityData;

        properties
          .filter(({ type }) => type === 'alarm-state')
          .forEach(({ propertyQueryInfo: { refId } }) => {
            if (refId) {
              accum[refId] = { detailedName: displayName, name: displayName };
            }
          });
      }

      return accum;
    }, {});
  }, [entityList]);

  const entityDataStyles = useMemo(() => {
    return entityList.reduce<StyleSettingsMap>((accum, entityData) => {
      if (isEntityWithProperties(entityData)) {
        const {
          component: { properties }
        } = entityData;
        const colors = generateItems(appKitConfig?.visualization?.data ?? []);

        properties
          .filter(({ type }) => type === 'data')
          .forEach(({ displayName, propertyQueryInfo: { propertyName, refId }, unit }, index) => {
            if (refId) {
              accum[refId] = {
                detailedName: displayName ?? propertyName,
                name: displayName ?? propertyName,
                color: colors.next().value?.color ?? DEFAULT_DATA_COLOR,
                unit
              };
            }
          });
      }

      return accum;
    }, {});
  }, [entityList]);

  const lineChart = useMemo(() => {
    if (selectedEntity.entity && isEntityWithProperties(selectedEntity.entity)) {
      const historyQueries = getEntityHistoryQueries(selectedEntity.entity, 'data', true);

      return historyQueries.map((query) => {
        return (
          <LineChart
            axis={{ showX: true, showY: true }}
            historyQueries={[query]}
            key={crypto.randomUUID()}
            styles={entityDataStyles}
          />
        );
      });
    }

    return null;
  }, [selectedEntity, entityDataStyles]);

  const statusTimelineChart = useMemo(() => {
    const thresholds = getAlarms()
      .filter(({ value }) => value !== 'Normal')
      .map((threshold) => {
        if (threshold.value === 'NormalDark') {
          return { ...threshold, value: 'Normal' };
        }
        return threshold;
      });

    if (selectedEntity.entity) {
      if (isEntityWithProperties(selectedEntity.entity)) {
        const historyQueries = getEntityHistoryQueries(selectedEntity.entity, 'alarm-state').filter(
          (query) => query.properties.length > 0
        );

        if (historyQueries.length > 0) {
          return (
            <StatusTimelineChart
              key={crypto.randomUUID()}
              historyQueries={historyQueries}
              thresholds={thresholds}
              styles={entityAlarmStyles}
            />
          );
        }
      }

      return null;
    } else {
      const historyQueries = getAllHistoryQueries(entityList, 'alarm-state');

      return (
        <StatusTimelineChart
          key={crypto.randomUUID()}
          historyQueries={historyQueries}
          thresholds={thresholds}
          styles={entityAlarmStyles}
        />
      );
    }
  }, [entityAlarmStyles, entityList, selectedEntity]);

  /**
   * Force a rerender by generating a new component key when `panels` changes.
   * **Necessary to trigger resize of @iot-app-kit charts.**
   */
  const panelKey = useMemo(() => crypto.randomUUID(), [openFlexPanels]);

  return lineChart || statusTimelineChart ? (
    <Panel
      className={createClassName(styles.root, className)}
      data-is-entity={!isEmpty(selectedEntity.entity)}
      key={panelKey}
      {...props}
    >
      <TimeSync initialViewport={appKitConfig?.timeSeriesData?.viewport}>
        <div className={styles.name}>Alarm Status</div>
        <div className={styles.charts}>{statusTimelineChart}</div>

        {lineChart && (
          <>
            <div className={styles.name}>
              {`${selectedEntity.entity?.component?.properties
                ?.filter(({ type }) => type === 'data')
                .map((prop) => prop.displayName ?? '')
                .join('/')} trends`}
            </div>
            <div className={styles.charts}>{lineChart}</div>
          </>
        )}
      </TimeSync>
      <WebglContext />
    </Panel>
  ) : (
    <Panel className={createClassName(styles.emptyState, className)} {...props}>
      {isFunction(emptyState) ? emptyState(selectedEntity.entity) : emptyState}
    </Panel>
  );
}
