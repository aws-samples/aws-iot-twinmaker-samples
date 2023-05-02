// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import { ENTITY_DATA, IGNORED_ENTITIES } from '@/config/iottwinmaker';
import type { SelectedEntity, TwinMakerEntityHistoryQuery } from '@/lib/types';
import { createHistoryQuery, createHistoryQueries } from '@/lib/utils/entity';

export const DEFAULT_SELECTED_ENTITY: SelectedEntity = { entityData: null, type: null } as const;

export const normalizedEntityData = ENTITY_DATA.filter(({ entityId }) => !isIgnoredEntity(entityId));
export const defaultAlarmHistoryQuery = normalizedEntityData.map((entity) => createHistoryQuery(entity, 'alarm'));
export const defaultDataHistoryQuery = normalizedEntityData.reduce<TwinMakerEntityHistoryQuery[]>((accum, entity) => {
  return [...accum, ...createHistoryQueries(entity, 'data')];
}, []);

export function isIgnoredEntity(entityId: string) {
  return IGNORED_ENTITIES.includes(entityId);
}
