// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { atom, computed } from '@iot-prototype-kit/core/store';
import type { Entity, SelectedEntity } from '@iot-prototype-kit/types';
import { getAllHistoryQueries } from '@iot-prototype-kit/utils/entity';

const DEFAULT_SELECTED_ENTITY: SelectedEntity = { entity: null, originId: null };

export const $entities = atom<Record<string, Entity>>({});
export const $selectedEntity = atom(DEFAULT_SELECTED_ENTITY);

export const $entityList = computed($entities, (entities) => {
  return Object.values(entities).reduce<Entity[]>((accum, entity) => {
    accum.push(entity);
    return accum;
  }, []);
});

export const $entitiesWithVideo = computed($entities, (entities) => {
  return Object.values(entities).reduce<Entity[]>((accum, entity) => {
    if (entity.video) accum.push(entity);
    return accum;
  }, []);
});

export const $entityHistoryQueries = computed($entityList, (entityList) => {
  return [
    ...getAllHistoryQueries(entityList, 'data'),
    ...getAllHistoryQueries(entityList, 'alarm-state'),
    ...getAllHistoryQueries(entityList, 'alarm-message')
  ];
});

export function resetEntities() {
  $entities.set({});
}

export function resetSelectedEntity() {
  $selectedEntity.set(DEFAULT_SELECTED_ENTITY);
}

export function setEntities(entities: Record<string, Entity>) {
  $entities.set({ ...entities });
}

export function setSelectedEntity(entity: Entity | null, originId: string | null) {
  $selectedEntity.set({ entity, originId });
}
