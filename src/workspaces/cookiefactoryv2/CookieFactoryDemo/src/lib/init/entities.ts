// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { ENTITY_DATA, IGNORED_ENTITY_IDS } from '@/config/project';
import type { EntityData, EntityPropertyType, SelectedEntity, TwinMakerEntityHistoryQuery } from '@/lib/types';
import { createEntityHistoryQuery, createEntityHistoryQueries, isEntityWithProperties } from '@/lib/utils/entity';

export const DEFAULT_SELECTED_ENTITY: SelectedEntity = { entityData: null, type: null } as const;

export const normalizedEntityData = ENTITY_DATA.filter(({ entityId }) => !isIgnoredEntity(entityId));

export function isIgnoredEntity(entityId: string) {
  return IGNORED_ENTITY_IDS.includes(entityId);
}

export function getAllHistoryQueries(type: EntityPropertyType, queryPerProperty = false) {
  return normalizedEntityData.reduce<TwinMakerEntityHistoryQuery[]>((accum, entity) => {
    accum.push(...getEntityHistoryQueries(entity, type, queryPerProperty));
    return accum;
  }, []);
}

export function getEntityHistoryQueries(entity: EntityData, type: EntityPropertyType, queryPerProperty = false) {
  if (isEntityWithProperties(entity)) {
    if (queryPerProperty) {
      return createEntityHistoryQueries(entity, type);
    }
    return [createEntityHistoryQuery(entity, type)];
  }
  return [];
}
