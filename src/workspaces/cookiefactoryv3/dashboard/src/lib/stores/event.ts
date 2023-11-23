// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { action, atom, computed, onMount } from '@iot-prototype-kit/core/store';
import { isEmpty } from '@iot-prototype-kit/core/utils/lang2';
import { $alarmValues } from '@iot-prototype-kit/stores/data';
import { $entities } from '@iot-prototype-kit/stores/entity';
import { $site } from '@iot-prototype-kit/stores/site';
import { $now } from '@iot-prototype-kit/stores/time';
import type { Entity, Primitive } from '@iot-prototype-kit/types';
import { getAlarmByValue } from '@iot-prototype-kit/utils/data';

import type { AppAlarmState, Event, EventState } from '@/lib/types';
import { getEventsConfig } from '@/lib/utils/config';

const ONE_SECOND = 1000;
const ONE_MINUTE = ONE_SECOND * 60;
const ONE_HOUR = ONE_SECOND * ONE_MINUTE * 60;

type Events = Record<string, Event>;

export const $events = atom<Events>({});

export const $allEvents = computed($events, (events) => {
  return Object.values(events).sort(sortDesc).filter(filterLastHour);
});

function sortDesc(a: Event, b: Event) {
  return b.lastModififedTimestamp - a.lastModififedTimestamp;
}

function filterLastHour(event: Event) {
  return event.lastModififedTimestamp > Date.now() - ONE_HOUR;
}

export const $eventCounts = computed($allEvents, (allEvents) => {
  return {
    high: allEvents.filter(({ state }) => state === 'high').length,
    medium: allEvents.filter(({ state }) => state === 'medium').length,
    low: allEvents.filter(({ state }) => state === 'low').length,
    resolved: allEvents.filter(({ status }) => status === 'resolved').length
  };
});

export const addEvent = action($events, 'addEvent', ({ get, set }, event: Event) => {
  const events = get();
  events[event.id] = event;
  setEvents(events);
});

export function getLatestEventByEntityId(entityId: string) {
  const events = $allEvents.get();
  return events.find((event) => event.entity.entityId === entityId);
}

export const resetEvents = action($events, 'resetEvents', ({ set }) => set({}));
export const setEvents = action($events, 'setEvents', ({ set }, events: Events) => set({ ...events }));

export function createEvent(entity: Entity, eventState: EventState, timestamp: number, message: Primitive) {
  const eventsConfig = getEventsConfig();

  if (eventsConfig) {
    const { subject, message: _message } = eventsConfig.createEventMessage(entity, message);

    addEvent({
      createdTimestamp: timestamp,
      entity,
      id: crypto.randomUUID(),
      lastModififedTimestamp: timestamp,
      message: _message,
      state: eventState,
      status: 'active',
      subject,
      type: 'alarm'
    });
  }
}

// private

// Purge events older than one hour
onMount($events, () => {
  const intervalId = setInterval(() => {
    const events = $events.get();

    Object.values(events)
      .filter(({ lastModififedTimestamp }) => lastModififedTimestamp < $now.get() - ONE_HOUR)
      .forEach(({ id }) => {
        delete events[id];
      });

    setEvents(events);
  }, ONE_MINUTE);

  return () => {
    clearInterval(intervalId);
  };
});

$alarmValues.listen((alarmValues) => {
  Object.entries(alarmValues).forEach(
    ([
      entityId,
      {
        dataPoint: { x, y }
      }
    ]) => {
      const alarmState = getAlarmByValue<AppAlarmState>(y);

      if (isEmpty(alarmState)) return;

      const entity = $entities.get()[entityId];

      if (isEmpty(entity)) return;

      const event = Object.values($events.get())
        .sort(sortDesc)
        .filter(filterLastHour)
        .find(({ entity }) => entity.entityId === entityId);

      if (event) {
        if (alarmState !== 'normal' && event.status === 'resolved') {
          // Previous event was resolved, create a new event
          createEvent(event.entity, alarmState, x, y);
        } else if (alarmState !== event.state) {
          // Update existing event if new state
          const events = $events.get();

          events[event.id].lastModififedTimestamp = x;
          events[event.id].state = alarmState;
          events[event.id].status = alarmState === 'normal' ? 'resolved' : 'active';

          setEvents(events);
        }
      } else if (alarmState !== 'normal' && alarmState !== 'unknown') {
        // Create a new event
        createEvent(entity, alarmState, x, y);
      }
    }
  );
});

$site.listen(() => resetEvents());
