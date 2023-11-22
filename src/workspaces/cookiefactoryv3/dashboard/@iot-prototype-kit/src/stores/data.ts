// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { action, atom } from '@iot-prototype-kit/core/store';
import { lastItem, takeRight } from '@iot-prototype-kit/core/utils/lang2';
import { $entityList } from '@iot-prototype-kit/stores/entity';
import type {
  AlarmState,
  DataPoint,
  DataStream,
  DataStreamMetaData,
  EntitiesLatestValues,
  LatestValue,
  Trend
} from '@iot-prototype-kit/types';
import { computeAlarmTrend, computeDataTrend } from '@iot-prototype-kit/utils/data';
import { getAlarmColors } from '@iot-prototype-kit/utils/data';

import { $site } from './site';

export const $alarmValues = atom<Record<string, LatestValue<string>>>({});
export const $dataStreams = atom<DataStream[]>([]);
export const $entitiesLatestValues = atom<EntitiesLatestValues>({});

export const resetAlarmValues = action($alarmValues, 'resetAlarmValues', ({ set }) => set({}));
export const resetDataStreams = action($dataStreams, 'resetDataStreams', ({ set }) => set([]));

export const resetEntitiesLatestValues = action($entitiesLatestValues, 'resetEntitiesLatestValues', ({ set }) =>
  set({})
);

export const setAlarmValues = action(
  $alarmValues,
  'setAlarmValues',
  (store, alarmValues: Record<string, LatestValue<string>>) => {
    store.set({ ...alarmValues });
  }
);

export const setEntitiesLatestValues = action(
  $entitiesLatestValues,
  'setEntitiesLatestValues',
  (store, latestEntityPropertyValues: EntitiesLatestValues) => {
    store.set({ ...latestEntityPropertyValues });
  }
);

$dataStreams.listen((dataStreams) => {
  for (const { data, meta } of dataStreams) {
    if (meta) {
      const { componentName, entityId, propertyName } = meta as DataStreamMetaData;
      const entity = $entityList.get().find((entity) => entity.entityId === entityId);

      if (entity) {
        const latestValues = takeRight(data, 2);
        const latestValue = lastItem(latestValues);

        if (latestValue) {
          const propertyData = entity.component?.properties?.find(
            ({ propertyQueryInfo: { propertyName: name } }) => name === propertyName
          );

          if (propertyData) {
            const displayName = propertyData.displayName ?? propertyName;
            let { threshold, unit } = propertyData;

            // Handle alarm value
            if (
              entity.component?.properties?.find(({ propertyQueryInfo: { propertyName: pn }, type }) => {
                return type === 'alarm-state' && pn === propertyName;
              })
            ) {
              const alarmValues = $alarmValues.get();
              const { x, y } = latestValue as DataPoint<AlarmState>;
              let trend: Trend | undefined = undefined;

              if (propertyData.computeTrend) {
                const alarmStateNames = getAlarmColors().map(({ value }) => value);
                trend = computeAlarmTrend({ entityId, propertyName, x, y }, alarmStateNames);
              }

              alarmValues[entityId] = {
                dataPoint: { x, y },
                displayName,
                metaData: { componentName, entityId, propertyName },
                trend
              };

              setAlarmValues(alarmValues);
            }

            // Handle data value
            if (
              entity.component?.properties?.find(({ propertyQueryInfo: { propertyName: pn }, type }) => {
                return type === 'data' && pn === propertyName;
              })
            ) {
              let trend: Trend | undefined = undefined;

              if (propertyData.computeTrend) {
                trend = computeDataTrend({ entityId, propertyName, ...latestValue });
              }

              const entitiesLatestValues = $entitiesLatestValues.get();

              entitiesLatestValues[entityId] = {
                ...entitiesLatestValues[entityId],
                [propertyName]: {
                  dataPoint: latestValue,
                  displayName,
                  metaData: { componentName, entityId, propertyName },
                  threshold,
                  trend,
                  unit
                }
              };

              setEntitiesLatestValues(entitiesLatestValues);
            }
          }
        }
      }
    }
  }
});
