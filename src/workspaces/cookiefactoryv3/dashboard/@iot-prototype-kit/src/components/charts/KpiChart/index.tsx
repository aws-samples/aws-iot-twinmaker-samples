// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { RelativeTime } from '@iot-prototype-kit/core/components/RelativeTime';
import { TrendIcon } from '@iot-prototype-kit/components/svgs/icons/TrendIcon';
import { createClassName, type ComponentProps } from '@iot-prototype-kit/core/utils/element';
import { isNotNil, isNumber, isPlainObject } from '@iot-prototype-kit/core/utils/lang2';
import type { AlarmState, LatestValue, Primitive } from '@iot-prototype-kit/types';
import { getAlarmByValue } from '@iot-prototype-kit/utils/data';

import styles from './styles.module.css';

const TIME_PREFIX = 'Last update:';

export function KpiChart({
  alarmValue,
  className,
  latestValue: {
    dataPoint: { x, y },
    displayName,
    threshold,
    trend,
    unit
  }
}: ComponentProps<{
  alarmValue: LatestValue<string>;
  latestValue: LatestValue<Primitive>;
}>) {
  const alarmState = getAlarmByValue<AlarmState>(alarmValue?.dataPoint.y) ?? 'unknown';
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
      <section className={styles.propertyName}>{displayName}</section>
      <section className={styles.valueSection}>
        <div className={styles.valueGroup}>
          <div className={styles.value}>{y}</div>
          {unit && <div className={styles.unit}>{unit}</div>}
        </div>
        <section className={createClassName(styles.trendSection, { [styles.thresholdBreached]: thresholdBreached })}>
          {isNotNil(thresholdLowerValue) && (
            <ThresholdIndicator
              value={thresholdLowerValue}
              limit="lower"
              isActive={isNumber(y) && y < thresholdLowerValue}
            />
          )}
          {isNotNil(trend) && (
            <TrendIcon
              className={createClassName(styles.trendIcon, {
                [styles.trendIconDown]: trend === -1,
                [styles.trendIconUp]: trend === 1
              })}
            />
          )}
          {isNotNil(thresholdUpperValue) && (
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
