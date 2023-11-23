// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import type { ValueOf } from 'type-fest';

import type { EntityData, Primitive } from '@/lib/types';

const DATA_PROPERTY_NAME_1 = 'Speed';
const DATA_PROPERTY_NAME_2 = 'Temperature';
const ALARM_MESSAGE_PROPERTY_NAME = 'AlarmMessage';
const ALARM_VALUE_PROPERTY_NAME = 'AlarmMessage';

export const COMPONENT_NAMES = {
  Equipment: 'CookieLineComponent',
  ProcessStep: 'ProcessStepComponent'
};

export const ENTITY_TYPES = {
  Equipment: 'Equipment',
  ProcessStep: 'Process step'
};

const PROCESS_ENTITY_DATA: EntityData[] = [
  {
    entityId: 'BoxErecting_db7dc38e-5b9c-46d4-a5b7-cd83543b7e63',
    componentName: COMPONENT_NAMES.ProcessStep,
    name: 'Box Erecting',
    type: ENTITY_TYPES.ProcessStep
  },
  {
    entityId: 'BoxLabeling_a9c0a04e-4681-43d4-8b73-c6c1bbcaf54b',
    componentName: COMPONENT_NAMES.ProcessStep,
    name: 'Box Labeling',
    type: ENTITY_TYPES.ProcessStep
  },
  {
    entityId: 'BoxSealing_78b17695-bf5a-4a0c-a15a-93232ce4abd6',
    componentName: COMPONENT_NAMES.ProcessStep,
    name: 'Box Sealing',
    type: ENTITY_TYPES.ProcessStep
  },
  {
    entityId: 'Forming_fbec6977-75c2-4cf8-a470-e61d0a589bb5',
    componentName: COMPONENT_NAMES.ProcessStep,
    name: 'Forming',
    type: ENTITY_TYPES.ProcessStep
  },
  {
    entityId: 'Freezing_01f790f8-08e4-401f-b2a2-6bc395178680',
    componentName: COMPONENT_NAMES.ProcessStep,
    name: 'Freezing',
    type: ENTITY_TYPES.ProcessStep
  },
  {
    entityId: 'Packing_defd8ea2-5535-432e-8f4b-bb80f5b3ff25',
    componentName: COMPONENT_NAMES.ProcessStep,
    name: 'Packing',
    type: ENTITY_TYPES.ProcessStep
  },
  {
    entityId: 'PlasticLining_09b64040-422c-47b0-a585-29e00ac28397',
    componentName: COMPONENT_NAMES.ProcessStep,
    name: 'Plastic Lining',
    type: ENTITY_TYPES.ProcessStep
  },
  {
    entityId: 'Shipping_e118463f-6bf0-4079-8a26-5b610d9e56be',
    componentName: COMPONENT_NAMES.ProcessStep,
    name: 'Shipping',
    type: ENTITY_TYPES.ProcessStep
  }
];

const EQUIPMENT_ENTITY_DATA: EntityData[] = [
  {
    entityId: 'BOX_ERECTOR_142496af-df2e-490e-aed5-2580eaf75e40',
    componentName: COMPONENT_NAMES.Equipment,
    name: 'Box Erector',
    properties: getProperties(),
    isRoot: true,
    type: ENTITY_TYPES.Equipment
  },
  {
    entityId: 'BOX_SEALER_ad434a34-4363-4a36-8153-20bd7189951d',
    componentName: COMPONENT_NAMES.Equipment,
    name: 'Box Sealer',
    properties: getProperties(),
    type: ENTITY_TYPES.Equipment
  },
  {
    entityId: 'COOKIE_FORMER_19556bfd-469c-40bc-a389-dbeab255c144',
    componentName: COMPONENT_NAMES.Equipment,
    name: 'Cookie Former',
    properties: getProperties(),
    isRoot: true,
    type: ENTITY_TYPES.Equipment
  },
  {
    entityId: 'CONVEYOR_LEFT_TURN_b28f2ca9-b6a7-44cd-a62d-7f76fc17ba45',
    componentName: COMPONENT_NAMES.Equipment,
    name: 'Conveyor Left Turn',
    properties: getProperties(),
    type: ENTITY_TYPES.Equipment
  },
  {
    entityId: 'CONVEYOR_RIGHT_TURN_c4f2df3d-26a2-45c5-a6c9-02ca00eb4af6',
    componentName: COMPONENT_NAMES.Equipment,
    name: 'Conveyor Right Turn',
    properties: getProperties(),
    type: ENTITY_TYPES.Equipment
  },
  {
    entityId: 'CONVEYOR_STRIGHT_9c62c546-f8ef-489d-9938-d46a12c97f32',
    componentName: COMPONENT_NAMES.Equipment,
    name: 'Conveyor Straight',
    properties: getProperties(),
    type: ENTITY_TYPES.Equipment
  },
  {
    entityId: 'FREEZER_TUNNEL_e12e0733-f5df-4604-8f10-417f49e6d298',
    componentName: COMPONENT_NAMES.Equipment,
    name: 'Freezer Tunnel',
    properties: [
      {
        propertyQueryInfo: {
          propertyName: ALARM_VALUE_PROPERTY_NAME,
          refId: crypto.randomUUID()
        },
        type: 'alarm-state'
      },
      {
        propertyQueryInfo: {
          propertyName: ALARM_MESSAGE_PROPERTY_NAME,
          refId: crypto.randomUUID()
        },
        type: 'alarm-message'
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
    ],
    type: ENTITY_TYPES.Equipment
  },
  {
    entityId: 'LABELING_BELT_5f98ffd2-ced1-48dd-a111-e3503b4e8532',
    componentName: COMPONENT_NAMES.Equipment,
    name: 'Labeling Belt',
    properties: getProperties(),
    type: ENTITY_TYPES.Equipment
  },
  {
    entityId: 'PLASTIC_LINER_a77e76bc-53f3-420d-8b2f-76103c810fac',
    componentName: COMPONENT_NAMES.Equipment,
    name: 'Plastic Liner',
    properties: getProperties(),
    type: ENTITY_TYPES.Equipment
  },
  {
    entityId: 'VERTICAL_CONVEYOR_d5423f7f-379c-4a97-aae0-3a5c0bcc9116',
    componentName: COMPONENT_NAMES.Equipment,
    name: 'Conveyor Vertical',
    properties: getProperties(),
    type: ENTITY_TYPES.Equipment
  }
];

export const ENTITY_DATA: EntityData[] = [...EQUIPMENT_ENTITY_DATA, ...PROCESS_ENTITY_DATA];

export const IGNORED_ENTITY_IDS: string[] = [];

export function createEventMessage(entityData: EntityData, message: Primitive): { name: string; message: string } {
  let normalizedName = '';
  let normailzedMessage = '';

  switch (entityData.entityId) {
    case 'FREEZER_TUNNEL_e12e0733-f5df-4604-8f10-417f49e6d298': {
      normalizedName = 'LN2 vapor flowing over exhaust troughs';
      normailzedMessage = `[Critical] Clogged exhaust pipe or full blast gate in piping`;
      break;
    }
    default: {
      normalizedName = 'Abnormal speed reduction';
      normailzedMessage = `Warning: Speed slowed abnormally on ${entityData.name}`;
    }
  }

  return {
    name: normalizedName,
    message: normailzedMessage
  };
}

function getProperties(): ValueOf<EntityData, 'properties'> {
  return [
    {
      propertyQueryInfo: {
        propertyName: ALARM_VALUE_PROPERTY_NAME,
        refId: crypto.randomUUID()
      },
      type: 'alarm-state'
    },
    {
      propertyQueryInfo: {
        propertyName: ALARM_MESSAGE_PROPERTY_NAME,
        refId: crypto.randomUUID()
      },
      type: 'alarm-message'
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
