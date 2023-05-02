// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import type { Threshold, Viewport } from '@iot-app-kit/core';

import { ALARM_STATUS_COLORS, STATUS_TIMELINE_TRACK_COLOR } from '@/lib/css/colors';
import type { AlarmState, EntityData, PanelId } from '@/lib/types';
import type { ValueOf } from 'type-fest';

const DATA_PROPERTY_NAME_1 = 'Speed';
const DATA_PROPERTY_NAME_2 = 'Temperature';

const alarmNames: Record<AlarmState, string> = {
  High: 'High',
  Medium: 'Medium',
  Low: 'Low',
  Normal: 'Normal',
  Unknown: 'Unknown'
};

export const ALARM_PROPERTY_NAME = 'AlarmMessage';

export const ALARM_THRESHOLDS: Threshold<AlarmState>[] = [
  {
    color: ALARM_STATUS_COLORS.High,
    label: { text: alarmNames['High'], show: true },
    value: 'High',
    comparisonOperator: 'EQ'
  },
  {
    color: ALARM_STATUS_COLORS.Medium,
    label: { text: alarmNames['Medium'], show: true },
    value: 'Medium',
    comparisonOperator: 'EQ'
  },
  {
    color: ALARM_STATUS_COLORS.Low,
    label: { text: alarmNames['Low'], show: true },
    value: 'Low',
    comparisonOperator: 'EQ'
  },
  {
    color: STATUS_TIMELINE_TRACK_COLOR,
    value: 'Normal',
    comparisonOperator: 'EQ'
  }
];

export const COMPONENT_NAMES = {
  DATA: 'CookieLineComponent',
  EQUIPMENT: 'CookieLineComponent',
  PROCESS_STEP: 'ProcessStepComponent'
};

export const DEFAULT_PANEL_ID: PanelId | null = null;
export const DEFAULT_QUERY_HOPS = 2;

export const ENTITY_DATA: EntityData[] = [
  {
    entityId: 'BOX_ERECTOR_142496af-df2e-490e-aed5-2580eaf75e40',
    componentName: COMPONENT_NAMES.DATA,
    properties: getProperties(),
    isRoot: true
  },
  {
    entityId: 'BOX_SEALER_ad434a34-4363-4a36-8153-20bd7189951d',
    componentName: COMPONENT_NAMES.DATA,
    properties: getProperties()
  },
  {
    entityId: 'COOKIE_FORMER_19556bfd-469c-40bc-a389-dbeab255c144',
    componentName: COMPONENT_NAMES.DATA,
    properties: getProperties(),
    isRoot: true
  },
  {
    entityId: 'CONVEYOR_LEFT_TURN_b28f2ca9-b6a7-44cd-a62d-7f76fc17ba45',
    componentName: COMPONENT_NAMES.DATA,
    properties: getProperties()
  },
  {
    entityId: 'CONVEYOR_RIGHT_TURN_c4f2df3d-26a2-45c5-a6c9-02ca00eb4af6',
    componentName: COMPONENT_NAMES.DATA,
    properties: getProperties()
  },
  {
    entityId: 'CONVEYOR_STRIGHT_9c62c546-f8ef-489d-9938-d46a12c97f32',
    componentName: COMPONENT_NAMES.DATA,
    properties: getProperties()
  },
  {
    entityId: 'FREEZER_TUNNEL_e12e0733-f5df-4604-8f10-417f49e6d298',
    componentName: COMPONENT_NAMES.DATA,
    properties: [
      {
        propertyQueryInfo: {
          propertyName: ALARM_PROPERTY_NAME,
          refId: crypto.randomUUID()
        },
        type: 'alarm'
      },
      {
        propertyQueryInfo: {
          propertyName: DATA_PROPERTY_NAME_1,
          refId: crypto.randomUUID()
        },
        threshold: { upper: 10, lower: 3 },
        type: 'data',
        unit: 'rpm'
      },
      {
        propertyQueryInfo: {
          propertyName: DATA_PROPERTY_NAME_2,
          refId: crypto.randomUUID()
        },
        threshold: { upper: -10, lower: -40 },
        type: 'data',
        unit: '°F'
      }
    ]
  },
  {
    entityId: 'LABELING_BELT_5f98ffd2-ced1-48dd-a111-e3503b4e8532',
    componentName: COMPONENT_NAMES.DATA,
    properties: getProperties()
  },
  // {
  //   entityId: 'PALLET_98648a84-72da-443a-b625-f671d99a13ba',
  //   componentName: COMPONENT_NAMES.DATA,
  //   properties: getProperties()
  // },
  {
    entityId: 'PLASTIC_LINER_a77e76bc-53f3-420d-8b2f-76103c810fac',
    componentName: COMPONENT_NAMES.DATA,
    properties: getProperties()
  },
  {
    entityId: 'VERTICAL_CONVEYOR_d5423f7f-379c-4a97-aae0-3a5c0bcc9116',
    componentName: COMPONENT_NAMES.DATA,
    properties: getProperties()
  }
];

export const IGNORED_ENTITIES = ['PALLET_98648a84-72da-443a-b625-f671d99a13ba'];

export const SDK_CUSTOM_USER_AGENT = 'cookiefactory_v2/1.0.0';

export const VIEWPORT: Viewport = { duration: '15m' };

function getProperties(): ValueOf<EntityData, 'properties'> {
  return [
    {
      propertyQueryInfo: {
        propertyName: ALARM_PROPERTY_NAME,
        refId: crypto.randomUUID()
      },
      type: 'alarm'
    },
    {
      propertyQueryInfo: {
        propertyName: DATA_PROPERTY_NAME_1,
        refId: crypto.randomUUID()
      },
      threshold: { upper: 10, lower: 3 },
      type: 'data',
      unit: 'rpm'
    },
    {
      propertyQueryInfo: {
        propertyName: DATA_PROPERTY_NAME_2,
        refId: crypto.randomUUID()
      },
      threshold: { upper: 50, lower: 15 },
      type: 'data',
      unit: '°F'
    }
  ];
}
