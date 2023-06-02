// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { TrendIcon } from '@/lib/components/svgs/icons';
import { createClassName, type ClassName } from '@/lib/core/utils/element';
import { isNumber, isPlainObject } from '@/lib/core/utils/lang';
import type { AlarmState, LatestValue, Primitive } from '@/lib/types';

import styles from './styles.module.css';

export function MiniKpiChart({
  alarmValue,
  className,
  latestValue: {
    dataPoint: { x, y },
    metaData: { propertyName },
    threshold,
    trend,
    unit
  }
}: {
  alarmValue: LatestValue<AlarmState>;
  className?: ClassName;
  latestValue: LatestValue<Primitive>;
}) {
  const alarmState: AlarmState = alarmValue?.dataPoint.y ?? 'Unknown';
  let hasBreachedThreshold = false;
  let thresholdUpperValue: number | undefined;
  let thresholdLowerValue: number | undefined;

  if (isPlainObject(threshold)) {
    const { upper, lower } = threshold;

    if (isNumber(y)) {
      if (upper) {
        thresholdUpperValue = upper;
        hasBreachedThreshold = y > upper;
      }

      if (!hasBreachedThreshold && lower) {
        thresholdLowerValue = lower;
        hasBreachedThreshold = y < lower;
      }
    }
  }

  return (
    <main className={createClassName(styles.main, className, styles[alarmState])}>
      <section className={styles.propertyName}>{propertyName}</section>
      <section className={styles.valueSection}>
        <div className={styles.valueGroup}>
          <div className={styles.value}>{y}</div>
          {unit && <div className={styles.unit}>{unit}</div>}
        </div>
        <TrendIcon
          className={createClassName(styles.trendIcon, {
            [styles.trendIconDown]: trend === -1,
            [styles.trendIconUp]: trend === 1,
            [styles.hasBreachedThreshold]: hasBreachedThreshold
          })}
        />
      </section>
    </main>
  );
}
