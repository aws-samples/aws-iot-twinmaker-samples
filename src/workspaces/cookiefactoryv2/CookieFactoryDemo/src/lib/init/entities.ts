// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { ENTITY_DATA, IGNORED_ENTITY_IDS } from '@/config/project';
import type { SelectedEntity, TwinMakerEntityHistoryQuery } from '@/lib/types';
import { createHistoryQuery, isEntityWithProperties } from '@/lib/utils/entity';

export const DEFAULT_SELECTED_ENTITY: SelectedEntity = { entityData: null, type: null } as const;

export const normalizedEntityData = ENTITY_DATA.filter(({ entityId }) => !isIgnoredEntity(entityId));
export const defaultAlarmHistoryQuery = normalizedEntityData.reduce<TwinMakerEntityHistoryQuery[]>((accum, entity) => {
  if (isEntityWithProperties(entity)) {
    accum.push(createHistoryQuery(entity, 'alarm'));
  }
  return accum;
}, []);
export const defaultDataHistoryQuery = normalizedEntityData.reduce<TwinMakerEntityHistoryQuery[]>((accum, entity) => {
  if (isEntityWithProperties(entity)) {
    accum.push(createHistoryQuery(entity, 'data'));
  }
  return accum;
}, []);

export function isIgnoredEntity(entityId: string) {
  return IGNORED_ENTITY_IDS.includes(entityId);
}
