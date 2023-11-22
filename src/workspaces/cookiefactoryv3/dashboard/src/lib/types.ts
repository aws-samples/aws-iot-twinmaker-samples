/* Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023 */
/* SPDX-License-Identifier: Apache-2.0 */

import type { Alarm, Alarms, AlarmState, Entity } from '@iot-prototype-kit/types';

// export type AppAlarms = Alarms<{
//   // high: Alarm;
//   blocked: Alarm;
//   down: Alarm;
//   // low: Alarm;
//   starved: Alarm;
//   // medium: Alarm;
//   running: Alarm;
//   // normalDark: Alarm;
// }>;
export type AppAlarmState = keyof AppAlarms;
export type AppAlarms = Alarms<Record<'blocked' | 'down' | 'running' | 'starved', Alarm>>;

export type Event = {
  createdTimestamp: number;
  entity: Entity;
  id: string;
  lastModififedTimestamp: number;
  message?: string;
  state: EventState;
  status: EventStatus;
  subject: string;
  type: EventType;
};
export type EventState = keyof AppAlarms; //'Critical' | 'High' | 'Medium' | 'Low' | 'Normal' | 'Unknown';
export type EventStatus = 'acknowledged' | 'active' | 'assigned' | 'resolved' | 'shelved' | 'suppressed';
export type EventType = 'alarm' | 'info';
