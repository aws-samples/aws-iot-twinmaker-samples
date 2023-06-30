// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import type { ValueOf } from 'type-fest';

import { createEventMessage } from '@/config/project';
import { createStore, createStoreHook } from '@/lib/core/store';
import { lastItem, takeRight } from '@/lib/core/utils/lang';
import { normalizedEntityData } from '@/lib/init/entities';
import { allEvents, eventStore } from '@/lib/stores/event';
import type {
  AlarmState,
  DataStream,
  DataStreamMetaData,
  EntityData,
  Event,
  EventState,
  LatestValue,
  Primitive,
  Threshold
} from '@/lib/types';
import { isEntityWithProperties } from '@/lib/utils/entity';

export type LatestValuesMap = Record<string, { [key: string]: LatestValue<Primitive> }>;

export const alarmStateStore = createStore<Record<string, LatestValue<AlarmState>>>({});
export const dataStreamsStore = createStore<DataStream[]>([]);
export const latestValuesStore = createStore<LatestValuesMap>({});
export const useAlarmStateStore = createStoreHook(alarmStateStore);
export const useDataStreamsStore = createStoreHook(dataStreamsStore);
export const useLatestValuesStore = createStoreHook(latestValuesStore);

export function resetDataStores() {
  alarmStateStore.resetToInitialState();
  dataStreamsStore.resetToInitialState();
  latestValuesStore.resetToInitialState();
}

/**
 * Set alarm and latest value state on each data stream update.
 */
dataStreamsStore.subscribe((getState) => {
  const state = getState();

  for (const { data, meta } of state) {
    if (meta) {
      const { componentName, entityId, propertyName } = meta as DataStreamMetaData;
      const entityData = normalizedEntityData.find((entity) => entity.entityId === entityId);

      if (entityData) {
        const latestValues = takeRight(data, 2);
        const latestValue = lastItem(latestValues);

        if (latestValue) {
          let threshold: Threshold | undefined;
          let trend: ValueOf<LatestValue<Primitive>, 'trend'> = 0;
          let unit: string | undefined;
          let eventState: EventState = 'Normal';

          if (
            entityData.properties?.find(({ propertyQueryInfo: { propertyName: pn }, type }) => {
              return type === 'alarm-state' && pn === propertyName;
            })
          ) {
            alarmStateStore.setState((state) => {
              const { x, y } = latestValue;

              eventState = y as AlarmState;

              state[entityId] = {
                dataPoint: { x, y: eventState },
                metaData: { componentName, entityId, propertyName },
                trend
              };

              return state;
            });
          }

          if (
            entityData.properties?.find(({ propertyQueryInfo: { propertyName: pn }, type }) => {
              return type === 'alarm-message' && pn === propertyName;
            })
          ) {
            const events = allEvents.getState();
            const event = events.find((event) => event.entityData.entityId === entityId);

            if (event) {
              if (eventState !== 'Normal' && event.status === 'resolved') {
                // Previous event was resolved, create a new event
                createEvent(event.entityData, eventState, latestValue.x, latestValue.y);
              } else if (eventState !== event.state) {
                // Update existing event with new state
                eventStore.setState((state) => {
                  state[event.id].lastModififedTimestamp = latestValue.x;
                  state[event.id].state = eventState;
                  state[event.id].status = eventState === 'Normal' ? 'resolved' : 'active';
                  return state;
                });
              }
            } else if (eventState !== 'Normal') {
              // Create a new event
              const entityData = normalizedEntityData.find((entity) => entity.entityId === entityId);

              if (entityData) {
                createEvent(entityData, eventState, latestValue.x, latestValue.y);
              }
            }
          }

          if (
            entityData.properties?.find(({ propertyQueryInfo: { propertyName: pn }, type }) => {
              return type === 'data' && pn === propertyName;
            })
          ) {
            if (latestValues.length === 2) {
              trend = latestValue.y > latestValues[0].y ? 1 : latestValue.y < latestValues[0].y ? -1 : 0;
            }

            const entityData = normalizedEntityData.find(({ entityId: id }) => id === entityId);

            if (entityData && isEntityWithProperties(entityData)) {
              const propertyData = entityData.properties.find(
                ({ propertyQueryInfo: { propertyName: name } }) => name === propertyName
              );

              if (propertyData) {
                let { threshold: t, unit: u } = propertyData;
                unit = u;
                threshold = t;
              }
            }

            latestValuesStore.setState((state) => {
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
  }
});

function createEvent(entityData: EntityData, eventState: EventState, timestamp: number, message: Primitive) {
  const { name, message: m } = createEventMessage(entityData, message);

  eventStore.setState((state) => {
    const event: Event = {
      createdTimestamp: timestamp,
      entityData,
      id: crypto.randomUUID(),
      lastModififedTimestamp: timestamp,
      name,
      message: m,
      state: eventState,
      status: 'active',
      type: 'alarm'
    };

    state[event.id] = event;

    return state;
  });
}
