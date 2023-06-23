// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { useMemo, type ReactNode } from 'react';

import { MiniKpiChart } from '@/lib/components/charts';
import { AlarmHighIcon, AlarmLowIcon, AlarmMediumIcon, MessagesIcon } from '@/lib/components/svgs/icons';
import { Circle } from '@/lib/components/svgs/shapes';
import type { NodeRenderData, NodeSingular } from '@/lib/core/graph';
import { createClassName } from '@/lib/core/utils/element';
import { compareStrings } from '@/lib/core/utils/string';
import { useAlarmStateStore, useLatestValuesStore } from '@/lib/stores/data';
import { useAllEvents } from '@/lib/stores/event';
import type { AlarmState, EntityData } from '@/lib/types';

import styles from './styles.module.css';

const DEFAULT_TEXT = {
  noProperties: 'No property data available'
};

export function OverlayContent({ node }: { node: NodeSingular }) {
  const [alarms] = useAlarmStateStore();
  const [latestValuesMap] = useLatestValuesStore();
  const allEvents = useAllEvents();

  return useMemo(() => {
    const {
      entityData: { entityId, name, type }
    } = node.data() as NodeRenderData<EntityData>;
    const alarmValue = alarms[entityId];
    const latestValues = latestValuesMap[entityId];
    let alarmState = alarmValue?.dataPoint.y ?? 'Unknown';
    let alarmMessage: string | undefined;
    let kpis: ReactNode[] = [];

    const event = allEvents.find(({ entityData: { entityId: id }, status }) => {
      return id === entityId && status !== 'resolved';
    });

    if (event) {
      alarmMessage = event.name;
    }

    if (latestValues) {
      kpis = Object.values(latestValues)
        .sort((a, b) => compareStrings(a.metaData.propertyName, b.metaData.propertyName))
        .map((latestValue) => {
          return (
            <MiniKpiChart
              alarmValue={alarmValue}
              className={styles.kpi}
              key={latestValue.metaData.entityId + latestValue.metaData.propertyName}
              latestValue={latestValue}
            />
          );
        });
    }

    return (
      <main className={createClassName(styles.overlay, styles[alarmState])}>
        <section className={styles.header}>
          <Circle className={createClassName(styles.alarmStatusIcon, styles[alarmState])} />
          <section className={styles.headerTitleSection}>
            <div className={styles.headerTitle}>{name}</div>
            {type && <div className={styles.headerSubtitle}>{type}</div>}
          </section>
        </section>
        <section className={styles.bodySection}>
          {alarmMessage && (
            <section className={styles.alarmMessageSection}>
              <AlarmMessageIcon alarmState={alarmState} />
              <span>{alarmMessage}</span>
            </section>
          )}
          <section className={createClassName(styles.kpis, { [styles.kpisEmptyState]: kpis.length === 0 })}>
            {kpis.length > 0 ? kpis : DEFAULT_TEXT.noProperties}
          </section>
        </section>
      </main>
    );
  }, [node, alarms, latestValuesMap]);
}

function AlarmMessageIcon({ alarmState }: { alarmState: AlarmState }) {
  const className = createClassName(styles.alarmMessageIcon, styles[alarmState]);

  return useMemo(() => {
    switch (alarmState) {
      case 'High': {
        return <AlarmHighIcon className={className} />;
      }
      case 'Medium': {
        return <AlarmMediumIcon className={className} />;
      }
      case 'Low': {
        return <AlarmLowIcon className={className} />;
      }
      default: {
        return <MessagesIcon className={className} />;
      }
    }
  }, [alarmState]);
}
