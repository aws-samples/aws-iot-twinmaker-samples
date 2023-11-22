// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { BellFilledIcon } from '@iot-prototype-kit/components/svgs/icons/BellIcon';
import { useStore } from '@iot-prototype-kit/core/store';
import { createClassName, type ComponentProps } from '@iot-prototype-kit/core/utils/element';
import { resetSelectedEntity } from '@iot-prototype-kit/stores/entity';
import { openPanel } from '@iot-prototype-kit/stores/panel';

import { $eventCounts } from '@/lib/stores/event';

import styles from './styles.module.css';

export function EventActivityStatus({ className, panelId }: ComponentProps<{ panelId: string }>) {
  const eventCounts = useStore($eventCounts);
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
      className={createClassName(styles.button, className, styles.events)}
      onPointerUp={() => {
        resetSelectedEntity();
        openPanel(panelId, true);
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
