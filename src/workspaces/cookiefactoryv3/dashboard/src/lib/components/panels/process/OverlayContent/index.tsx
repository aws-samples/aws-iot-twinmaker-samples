// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { useMemo, type ReactNode } from 'react';

import { MiniKpiChart } from '@iot-prototype-kit/components/charts/MiniKpiChart';
import { AlarmHighIcon, AlarmLowIcon, AlarmMediumIcon } from '@iot-prototype-kit/components/svgs/icons/AlarmIcons';
import { MessagesIcon } from '@iot-prototype-kit/components/svgs/icons/MessagesIcon';
import { Circle } from '@iot-prototype-kit/components/svgs/shapes/Circle';
import type { NodeRenderData, NodeSingular } from '@iot-prototype-kit/core/graph/types';
import { useStore } from '@iot-prototype-kit/core/store';
import { createClassName } from '@iot-prototype-kit/core/utils/element';
import { compareStrings } from '@iot-prototype-kit/core/utils/string';
import { $alarmValues, $entitiesLatestValues } from '@iot-prototype-kit/stores/data';
import type { Entity } from '@iot-prototype-kit/types';
import { getAlarmByValue } from '@iot-prototype-kit/utils/data';

import { $allEvents } from '@/lib/stores/event';
import type { AppAlarmState } from '@/lib/types';

import styles from './styles.module.css';

const DEFAULT_TEXT = {
  noProperties: 'No property data available'
};

export function OverlayContent({ node }: { node: NodeSingular }) {
  const alarmValues = useStore($alarmValues);
  const allEvents = useStore($allEvents);
  const entitiesLatestValues = useStore($entitiesLatestValues);

  return useMemo(() => {
    const {
      entityData: {
        entityId,
        metadata: { displayName, description }
      }
    } = node.data() as NodeRenderData<Entity>;
    const alarmValue = alarmValues[entityId];
    const latestValues = entitiesLatestValues[entityId];
    let alarmState = getAlarmByValue<AppAlarmState>(alarmValue?.dataPoint.y) ?? 'unknown';
    let alarmMessage: string | undefined;
    let kpis: ReactNode[] = [];

    const event = allEvents.find(({ entity: { entityId: id }, status }) => {
      return id === entityId && status !== 'resolved';
    });

    if (event) {
      alarmMessage = event.subject;
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
            <div className={styles.headerTitle}>{displayName}</div>
            {description && <div className={styles.headerSubtitle}>{description}</div>}
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
  }, [node, alarmValues]);
}

function AlarmMessageIcon({ alarmState }: { alarmState: AppAlarmState }) {
  const className = createClassName(styles.alarmMessageIcon, styles[alarmState]);

  return useMemo(() => {
    switch (alarmState) {
      case 'high': {
        return <AlarmHighIcon className={className} />;
      }
      case 'medium': {
        return <AlarmMediumIcon className={className} />;
      }
      case 'low': {
        return <AlarmLowIcon className={className} />;
      }
      default: {
        return <MessagesIcon className={className} />;
      }
    }
  }, [alarmState]);
}
