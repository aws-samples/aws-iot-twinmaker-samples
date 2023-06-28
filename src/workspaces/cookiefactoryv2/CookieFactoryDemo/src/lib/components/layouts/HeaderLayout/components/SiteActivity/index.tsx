// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { BellFilledIcon } from '@/lib/components/svgs/icons';
import { createClassName, type ClassName } from '@/lib/core/utils/element';
import { DEFAULT_SELECTED_ENTITY } from '@/lib/init/entities';
import { selectedStore } from '@/lib/stores/entity';
import { useEventCounts } from '@/lib/stores/event';
import { panelsStore } from '@/lib/stores/panels';

import styles from './styles.module.css';

export function SiteActivity({ className }: { className?: ClassName }) {
  return (
    <section className={createClassName(styles.root, className)}>
      <EventsInfo />
      {/* <InfoItem id="tickets" icon={<ListIcon />} />
      <InfoItem id="messages" icon={<MessagesIcon />} /> */}
    </section>
  );
}

function EventsInfo() {
  const eventCounts = useEventCounts();

  const eventCount = eventCounts.high + eventCounts.medium + eventCounts.low;

  const eventClassName =
    eventCounts.high > 0
      ? styles.High
      : eventCounts.medium > 0
      ? styles.Medium
      : eventCounts.low > 0
      ? styles.Low
      : undefined;

  return (
    <button
      className={createClassName(styles.button, styles.events)}
      onPointerUp={() => {
        selectedStore.setState(DEFAULT_SELECTED_ENTITY);
        panelsStore.setState((state) => {
          state.clear();
          state.add('events');
          return state;
        });
      }}
    >
      <BellFilledIcon className={createClassName(styles.icon, eventClassName)} />
      <section className={styles.eventIndicators}>
        <div className={styles.eventIndicator} data-indicator-high={eventCounts.high > 0} />
        <div className={styles.eventIndicator} data-indicator-medium={eventCounts.medium > 0} />
        <div className={styles.eventIndicator} data-indicator-low={eventCounts.low > 0} />
      </section>
      <section className={styles.label}>{eventCount}</section>
    </button>
  );
}

// function InfoItem({
//   className,
//   icon,
//   id,
//   style,
//   value = 0
// }: {
//   className?: ClassName;
//   icon: ReactNode;
//   id: PanelId;
//   style?: CSSProperties;
//   value?: number;
// }) {
//   return (
//     <button
//       className={createClassName(styles.button, className)}
//       onPointerUp={() => panelsStore.setState([id])}
//       style={style}
//     >
//       <span className={styles.icon}>{icon}</span>
//       <span className={styles.label}>{value}</span>
//     </button>
//   );
// }
