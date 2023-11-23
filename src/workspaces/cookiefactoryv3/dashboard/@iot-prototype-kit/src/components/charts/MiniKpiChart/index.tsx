// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { TrendIcon } from '@iot-prototype-kit/components/svgs/icons/TrendIcon';
import { createClassName, type ComponentProps } from '@iot-prototype-kit/core/utils/element';
import { isNotNil, isNumber, isPlainObject } from '@iot-prototype-kit/core/utils/lang2';
import type { AlarmState, LatestValue, Primitive } from '@iot-prototype-kit/types';
import { getAlarmByValue } from '@iot-prototype-kit/utils/data';

import styles from './styles.module.css';

export function MiniKpiChart({
  alarmValue,
  className,
  latestValue: {
    dataPoint: { y },
    displayName,
    threshold,
    trend,
    unit
  },
  showAlarmBar
}: ComponentProps<{
  alarmValue: LatestValue<string>;
  latestValue: LatestValue<Primitive>;
  showAlarmBar?: boolean;
}>) {
  const alarmState = getAlarmByValue<AlarmState>(alarmValue?.dataPoint.y) ?? 'unknown';
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
    <main
      className={createClassName(styles.main, className, styles[alarmState])}
      data-show-alarm-bar={showAlarmBar === true}
    >
      <section className={styles.propertyName}>{displayName}</section>
      <section className={styles.valueSection}>
        <div className={styles.valueGroup}>
          <div className={styles.value}>
            {y.toLocaleString(undefined, { maximumFractionDigits: 1 })}
          </div>
          {unit && <div className={styles.unit}>{unit}</div>}
        </div>
        {isNotNil(trend) && (
          <TrendIcon
            className={createClassName(styles.trendIcon, {
              [styles.trendIconDown]: trend === -1,
              [styles.trendIconUp]: trend === 1,
              [styles.hasBreachedThreshold]: hasBreachedThreshold
            })}
          />
        )}
      </section>
    </main>
  );
}
