// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { createDerivedStore, createDerivedStoreHook, createStore, createStoreHook } from '@/lib/core/store';
import type { Event } from '@/lib/types';

const ONE_SECOND = 1000;
const ONE_MINUTE = ONE_SECOND * 60;
const ONE_HOUR = ONE_SECOND * ONE_MINUTE * 60;

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

export const useAllEvents = createDerivedStoreHook(allEvents);
export const useEventCounts = createDerivedStoreHook(eventCounts);
export const useEventStore = createStoreHook(eventStore);

export function resetEventStores() {
  eventStore.resetToInitialState();
}

// private

// Purge events older than one hour
setInterval(() => {
  eventStore.setState((state) => {
    Object.values(state)
      .filter(({ lastModififedTimestamp }) => lastModififedTimestamp < Date.now() - ONE_HOUR)
      .forEach(({ id }) => {
        delete state[id];
      });

    return state;
  });
}, ONE_MINUTE);
