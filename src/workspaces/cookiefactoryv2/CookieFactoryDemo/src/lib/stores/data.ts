// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import type { ValueOf } from 'type-fest';

import { ALARM_PROPERTY_NAME } from '@/config/iottwinmaker';
import { createStore, createStoreHook } from '@/lib/core/store';
import { lastItem, takeRight } from '@/lib/core/utils/lang';
import { normalizedEntityData } from '@/lib/init/entities';
import type { AlarmState, DataStream, DataStreamMetaData, LatestValue, Primitive, Threshold } from '@/lib/types';

export const alarmState = createStore<Record<string, LatestValue<AlarmState>>>({});
export const dataStreamState = createStore<DataStream[]>([]);
export const latestValueState = createStore<Record<string, { [key: string]: LatestValue<Primitive> }>>({});

export const useAlarmState = createStoreHook(alarmState);
export const useDataStreamState = createStoreHook(dataStreamState);
export const useLatestValueState = createStoreHook(latestValueState);

/**
 * Set alarm and latest value state on each data stream update.
 */
dataStreamState.subscribe((getState) => {
  const state = getState();

  for (const { data, meta } of state) {
    if (meta) {
      const { componentName, entityId, propertyName } = meta as DataStreamMetaData;
      const latestValues = takeRight(data, 2);
      const latestValue = lastItem(latestValues);

      if (latestValue) {
        let threshold: Threshold | undefined;
        let trend: ValueOf<LatestValue<Primitive>, 'trend'> = 0;
        let unit: string | undefined;

        if (propertyName === ALARM_PROPERTY_NAME) {
          alarmState.setState((state) => {
            const { x, y } = latestValue;
            state[entityId] = {
              dataPoint: { x, y: y as AlarmState },
              metaData: { componentName, entityId, propertyName },
              trend
            };
            return state;
          });
        } else {
          if (latestValues.length === 2) {
            trend = latestValue.y > latestValues[0].y ? 1 : latestValue.y < latestValues[0].y ? -1 : 0;
          }

          const entityData = normalizedEntityData.find(({ entityId: id }) => id === entityId);

          if (entityData) {
            const propertyData = entityData.properties.find(
              ({ propertyQueryInfo: { propertyName: name } }) => name === propertyName
            );

            if (propertyData) {
              let { threshold: t, unit: u } = propertyData;
              unit = u;
              threshold = t;
            }
          }

          latestValueState.setState((state) => {
            state[entityId] = {
              ...state[entityId],
              [propertyName]: {
                dataPoint: latestValue,
                metaData: { componentName, entityId, propertyName },
                threshold,
                trend,
                unit
              }
            };
            return state;
          });
        }
      }
    }
  }
});
