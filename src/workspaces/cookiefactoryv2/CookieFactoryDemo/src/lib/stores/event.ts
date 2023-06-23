// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { createDerivedStore, createDerivedStoreHook, createStore, createStoreHook } from '@/lib/core/store';
import type { Event, EventStatus } from '@/lib/types';

const ONE_HOUR = 1000 * 60 * 60;

type EventStoreState = Record<string, Event>;

export const eventStore = createStore<EventStoreState>({});

export const allEvents = createDerivedStore(eventStore, (state) => {
  return Object.values(state)
    .sort((a, b) => {
      return b.lastModififedTimestamp - a.lastModififedTimestamp;
    })
    .filter((event) => event.lastModififedTimestamp > Date.now() - ONE_HOUR);
});

export const eventCounts = createDerivedStore(allEvents, (state) => {
  return {
    high: state.filter(({ state }) => state === 'High').length,
    medium: state.filter(({ state }) => state === 'Medium').length,
    low: state.filter(({ state }) => state === 'Low').length,
    resolved: state.filter(({ status }) => status === 'resolved').length
  };
});

// export const highAlarmCount = createDerivedStore(allEvents, (state) => {
//   return state.filter(({ state }) => state === 'High').length;
// });

// export const mediumAlarmCount = createDerivedStore(allEvents, (state) => {
//   return state.filter(({ state }) => state === 'Medium').length;
// });

// export const lowAlarmCount = createDerivedStore(allEvents, (state) => {
//   return state.filter(({ state }) => state === 'Low').length;
// });

// export const activeEvents = createDerivedStore(eventStore, (state) => {
//   return getSortedEventsByStatus(state, 'active');
// });

// export const acknowledgedEvents = createDerivedStore(eventStore, (state) => {
//   return getSortedEventsByStatus(state, 'acknowledged');
// });

// export const resolvedEvents = createDerivedStore(eventStore, (state) => {
//   return getSortedEventsByStatus(state, 'resolved');˝
// });

export const useAllEvents = createDerivedStoreHook(allEvents);
export const useEventCounts = createDerivedStoreHook(eventCounts);
export const useEventStore = createStoreHook(eventStore);

// private

// alarmValueStore.subscribe((getState) => {
//   const alarms = Object.values(getState());
//   const events = allEvents.getState();

//   alarms.forEach((alarm) => {
//     const event = events.find((event) => event.entityData.entityId === alarm.metaData.entityId);

//     if (event) {
//       if (alarm.dataPoint.y !== 'Normal' && event.status === 'resolved') {
//         // Previous event was resolved, create a new event
//         createEvent(event.entityData, alarm.dataPoint.y);
//       } else if (alarm.dataPoint.y !== event.state) {
//         // Update existing event with new state
//         eventStore.setState((state) => {
//           state[event.id].state = alarm.dataPoint.y;
//           state[event.id].status = alarm.dataPoint.y === 'Normal' ? 'resolved' : 'active';
//           return state;
//         });
//       }
//     } else if (alarm.dataPoint.y !== 'Normal') {
//       // Create a new event
//       const entityData = normalizedEntityData.find((entity) => entity.entityId === alarm.metaData.entityId);

//       if (entityData) {
//         createEvent(entityData, alarm.dataPoint.y);
//       }
//     }
//   });
// });

// Purge events older than one hour
setInterval(() => {
  eventStore.setState((state) => {
    return Object.values(state).reduce<EventStoreState>((accum, event) => {
      if (event.lastModififedTimestamp > Date.now() - ONE_HOUR) {
        accum[event.id] = event;
      }
      return accum;
    }, {});
  });
}, 1000);

function getSortedEventsByStatus(state: EventStoreState, status: EventStatus) {
  return Object.values(state)
    .filter((alarm) => {
      alarm.status === status;
    })
    .sort((a, b) => {
      return b.lastModififedTimestamp - a.lastModififedTimestamp;
    });
}
