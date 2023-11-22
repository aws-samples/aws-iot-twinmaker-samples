// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import type { Except } from 'type-fest';

import { $entitiesLatestValues } from '@iot-prototype-kit/stores/data';
import type {
  AlarmState,
  DataPoint,
  DataStreamMetaData,
  LatestValue,
  Primitive,
  Trend
} from '@iot-prototype-kit/types';
import { getAppKitConfig } from '@iot-prototype-kit/utils/config';

type ComputeTrendValue<T extends Primitive | AlarmState> = DataPoint<T> & Except<DataStreamMetaData, 'componentName'>;

export function computeAlarmTrend<State extends AlarmState>(value: ComputeTrendValue<State>, alarmsStates: string[]) {
  return computeTrend(value, (a, b) => {
    const prevIndex = alarmsStates.indexOf(a.y);
    const nextIndex = alarmsStates.indexOf(b.y);
    return prevIndex === nextIndex ? 0 : prevIndex < nextIndex ? 1 : -1;
  });
}

export function computeDataTrend(value: ComputeTrendValue<Primitive>): Trend {
  return computeTrend(value, (a, b) => {
    return a.y === b.y ? 0 : a.y < b.y ? 1 : -1;
  });
}

export function computeTrend<T extends Primitive>(
  { entityId, propertyName, x, y }: ComputeTrendValue<T>,
  compare: (a: DataPoint<T>, b: DataPoint<T>) => Trend
): Trend {
  const latestValue = getLatestValue<T>({ entityId, propertyName });

  if (latestValue) {
    if (latestValue.dataPoint.x < x) {
      return compare(latestValue.dataPoint, { x, y });
    }

    if (latestValue.trend) {
      return latestValue.trend;
    }
  }

  return 0;
}

export function getAlarmColors() {
  const alarms = Object.entries(getAppKitConfig()?.visualization?.alarms ?? []);
  return alarms.map(([id, { color, value }]) => {
    return { color, id, value };
  });
}

export function getAlarms() {
  return Object.values(getAppKitConfig()?.visualization?.alarms ?? []);
}

export function getAlarmByValue<T>(value: any): T | undefined {
  const alarms = Object.entries(getAppKitConfig()?.visualization?.alarms ?? {});
  const alarm = alarms.find(([, alarm]) => alarm.value === value);
  if (alarm) return alarm[0] as T;
}

// private

function getLatestValue<T extends Primitive>({ entityId, propertyName }: Except<DataStreamMetaData, 'componentName'>) {
  const latestValues = $entitiesLatestValues.get()[entityId];

  if (latestValues) {
    const latestValue = latestValues[propertyName];

    if (latestValue) {
      return latestValue as LatestValue<T>;
    }
  }
}
