// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { TrendIcon } from '@/lib/components/svgs/icons';
import { RelativeTime } from '@/lib/core/components';
import { createClassName, type ClassName } from '@/lib/core/utils/element';
import { isNumber, isPlainObject } from '@/lib/core/utils/lang';
import type { AlarmState, LatestValue, Primitive } from '@/lib/types';

import styles from './styles.module.css';

const TIME_PREFIX = 'Last update:';

export function KpiChart({
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
  let thresholdBreached = false;
  let thresholdUpperValue: number | undefined;
  let thresholdLowerValue: number | undefined;

  if (isPlainObject(threshold)) {
    const { upper, lower } = threshold;

    if (isNumber(y)) {
      if (upper) {
        thresholdUpperValue = upper;
        thresholdBreached = y > upper;
      }

      if (!thresholdBreached && lower) {
        thresholdLowerValue = lower;
        thresholdBreached = y < lower;
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
        <section className={createClassName(styles.trendSection, { [styles.thresholdBreached]: thresholdBreached })}>
          {thresholdLowerValue && (
            <ThresholdIndicator
              value={thresholdLowerValue}
              limit="lower"
              isActive={isNumber(y) && y < thresholdLowerValue}
            />
          )}
          <TrendIcon
            className={createClassName(styles.trendIcon, {
              [styles.trendIconDown]: trend === -1,
              [styles.trendIconUp]: trend === 1
            })}
          />
          {thresholdUpperValue && (
            <ThresholdIndicator
              value={thresholdUpperValue}
              limit="upper"
              isActive={isNumber(y) && y > thresholdUpperValue}
            />
          )}
        </section>
      </section>
      <section className={styles.timeSection} data-label={TIME_PREFIX}>
        <RelativeTime timestamp={x} options={{ numeric: 'auto', style: 'narrow', updateInterval: 1000 }} />
      </section>
    </main>
  );
}

function ThresholdIndicator({
  value,
  limit,
  isActive
}: {
  value: number;
  limit: 'upper' | 'lower';
  isActive: boolean;
}) {
  return (
    <main
      className={createClassName(styles.thresholdIndicator, {
        [styles.thresholdIndicatorLimitUpper]: limit === 'upper',
        [styles.thresholdIndicatorLimitLower]: limit === 'lower',
        [styles.isActive]: isActive
      })}
    >
      {value}
    </main>
  );
}
