// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { formatDuration, intervalToDuration } from 'date-fns';
import { useMemo, useState, type ReactNode } from 'react';

import { Panel, type PanelProps } from '@iot-prototype-kit/components/Panel';
import { RelativeTime } from '@iot-prototype-kit/core/components/RelativeTime';
import { useStore } from '@iot-prototype-kit/core/store';
import { AlarmHighIcon, AlarmMediumIcon, AlarmLowIcon } from '@iot-prototype-kit/components/svgs/icons/AlarmIcons';
import { SuccessIcon } from '@iot-prototype-kit/components/svgs/icons/SuccessIcon';
import { createClassName } from '@iot-prototype-kit/core/utils/element';
import { isFunction, isNil } from '@iot-prototype-kit/core/utils/lang2';
import { $selectedEntity } from '@iot-prototype-kit/stores/entity';
import { openPanel } from '@iot-prototype-kit/stores/panel';
import type { Entity } from '@iot-prototype-kit/types';

import { $allEvents } from '@/lib/stores/event';
import type { Event, EventState, EventStatus } from '@/lib/types';

export { EventActivityStatus } from './components/EventActivityStatus';

import styles from './styles.module.css';

type EventsPanelProps = PanelProps<{
  targetPanelId?: string;
  emptyState?: ReactNode | ((filter: EventFilter, entity?: Entity | null) => ReactNode);
}>;

type EventFilter = EventState | EventStatus | null;

const LABELS = {
  Detected: 'Detected',
  Lasted: 'Lasted'
};

export function EventsPanel({ className, emptyState, targetPanelId, ...props }: EventsPanelProps) {
  const allEvents = useStore($allEvents);
  const selectedEntity = useStore($selectedEntity);
  const [filter, setFilter] = useState<EventFilter | null>(null);

  const events = useMemo(() => {
    return allEvents
      .filter(({ state, status }) => {
        return filter ? state === filter || status === filter : true;
      })
      .filter(({ entity: { entityId } }) => {
        return selectedEntity.entity ? selectedEntity.entity.entityId === entityId : true;
      })
      .map((event) => <Event key={event.id} event={event} panelId={props.id} targetPanelId={targetPanelId} />);
  }, [allEvents, filter, props.id, selectedEntity]);

  const filteredCounts = useMemo(() => {
    const filteredEvents = allEvents.filter(({ entity: { entityId } }) =>
      selectedEntity.entity?.entityId ? entityId === selectedEntity.entity?.entityId : true
    );

    return {
      high: filteredEvents.filter(({ state }) => state === 'high').length,
      medium: filteredEvents.filter(({ state }) => state === 'medium').length,
      low: filteredEvents.filter(({ state }) => state === 'low').length,
      resolved: filteredEvents.filter(({ status }) => status === 'resolved').length
    };
  }, [allEvents, selectedEntity]);
  const eventContent = useMemo(() => {
    return events.length ? (
      <section className={styles.events}>
        <div className={styles.eventList}>{events}</div>
      </section>
    ) : (
      <section className={styles.emptyState}>
        {isFunction(emptyState) ? emptyState(filter, selectedEntity.entity) : emptyState}
      </section>
    );
  }, [events]);
  return (
    <Panel className={createClassName(styles.root, className)} data-has-event={events.length > 0} {...props}>
      <section className={styles.controls}>
        <div className={styles.filterMessage}>{getFilterMessage(filter)}</div>
        <div className={styles.alarmControls}>
          <button
            className={styles.alarmControl}
            data-active={isNil(filter) || filter === 'high'}
            onPointerUp={() =>
              setFilter((state) => {
                if (state === 'high') return null;
                return 'high';
              })
            }
          >
            <AlarmHighIcon className={createClassName(styles.alarmControlIcon, styles.alarmIconHigh)} />
            <span>{filteredCounts.high}</span>
          </button>
          <button
            className={styles.alarmControl}
            data-active={isNil(filter) || filter === 'medium'}
            onPointerUp={() =>
              setFilter((state) => {
                if (state === 'medium') return null;
                return 'medium';
              })
            }
          >
            <AlarmMediumIcon className={createClassName(styles.alarmControlIcon, styles.alarmIconMedium)} />
            <span>{filteredCounts.medium}</span>
          </button>
          <button
            className={styles.alarmControl}
            data-active={isNil(filter) || filter === 'low'}
            onPointerUp={() =>
              setFilter((state) => {
                if (state === 'low') return null;
                return 'low';
              })
            }
          >
            <AlarmLowIcon className={createClassName(styles.alarmControlIcon, styles.alarmIconLow)} />
            <span>{filteredCounts.low}</span>
          </button>
          <button
            className={styles.alarmControl}
            data-active={isNil(filter) || filter === 'resolved'}
            onPointerUp={() =>
              setFilter((state) => {
                if (state === 'resolved') return null;
                return 'resolved';
              })
            }
          >
            <SuccessIcon className={createClassName(styles.alarmControlIcon, styles.alarmIconResolved)} />
            <span>{filteredCounts.resolved}</span>
          </button>
        </div>
      </section>

      {eventContent}
    </Panel>
  );
}

function Event({ event, panelId, targetPanelId }: { event: Event; panelId: string; targetPanelId?: string }) {
  return (
    <button
      className={createClassName(styles.event, styles[event.state])}
      data-active={event.status !== 'resolved'}
      key={event.id}
      onPointerUp={() => {
        if ($selectedEntity.get().entity?.entityId !== event.entity.entityId) {
          $selectedEntity.set({ entity: event.entity, originId: panelId });
        }

        if (targetPanelId) openPanel(targetPanelId);
      }}
    >
      <section className={styles.body}>
        <div className={styles.icon}>{getIcon(event)}</div>
        <div className={styles.content}>
          <div className={styles.entityName}>{event.entity.metadata.displayName}</div>
          <div className={styles.name}>{event.subject}</div>
          <div className={styles.message}>{event.message}</div>
        </div>
      </section>
      <section className={styles.footer}>
        <span>{event.status}</span>
        <span data-label={LABELS.Detected}>
          <RelativeTime
            timestamp={event.createdTimestamp}
            options={{ numeric: 'auto', style: 'narrow', updateInterval: 1000 }}
          />
        </span>
        {event.status === 'resolved' && (
          <span data-label={LABELS.Lasted}>
            {formatDuration(intervalToDuration({ start: event.createdTimestamp, end: event.lastModififedTimestamp }), {
              format: ['days', 'hours', 'minutes', 'seconds']
            })}
          </span>
        )}
      </section>
    </button>
  );
}

// function getEmptyStateMessage(filter: EventFilter) {
//   switch (filter) {
//     case 'high':
//       return `No high priority events available`;
//     case 'medium':
//       return `No medium priority events available`;
//     case 'low':
//       return `No low priority events available`;
//     case 'resolved':
//       return `No resolved events available`;
//     default:
//       return `No events available`;
//   }
// }

function getFilterMessage(filter: EventFilter) {
  switch (filter) {
    case 'high':
      return `High priority events`;
    case 'medium':
      return `Medium priority events`;
    case 'low':
      return `Low priority events`;
    case 'resolved':
      return `Resolved events`;
    default:
      return `All events`;
  }
}

function getIcon(event: Event) {
  if (event.status === 'resolved') return <SuccessIcon />;

  switch (event.state) {
    case 'high':
      return <AlarmHighIcon />;

    case 'medium':
      return <AlarmMediumIcon />;

    case 'low':
      return <AlarmLowIcon />;

    default:
      return <SuccessIcon />;
  }
}
