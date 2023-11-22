// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import type { SetRequired, RequiredDeep, ValueOf, Except } from 'type-fest';

import { isEmpty } from '@iot-prototype-kit/core/utils/lang2';
import type {
  ComponentConfig,
  Entity,
  EntityPropertyType,
  TimeSeriesDataQuery,
  TwinMakerDataSource,
  TwinMakerEntityHistoryQuery,
  TwinMakerQueryNodeData
} from '@iot-prototype-kit/types';

type RequiredProperties = Except<Entity, 'component'> & Pick<RequiredDeep<Entity>, 'component'>;

export function createEntityHistoryQuery<T extends RequiredProperties>(
  entity: T,
  ...propertyType: EntityPropertyType[]
): TwinMakerEntityHistoryQuery {
  const {
    component: { componentName, properties },
    entityId
  } = entity;

  const reducedProperties = properties.reduce<ValueOf<TwinMakerEntityHistoryQuery, 'properties'>>(
    (accum, { propertyQueryInfo, type }) => {
      if (type && propertyType.includes(type)) {
        accum.push(propertyQueryInfo);
      }
      return accum;
    },
    []
  );

  return { componentName, entityId, properties: reducedProperties };
}

export function createEntityHistoryQueries<T extends RequiredProperties>(
  entity: T,
  ...propertyType: EntityPropertyType[]
): TwinMakerEntityHistoryQuery[] {
  const {
    component: { componentName, properties },
    entityId
  } = entity;

  return properties.reduce<TwinMakerEntityHistoryQuery[]>((accum, { propertyQueryInfo, type }) => {
    if (type && propertyType.includes(type)) {
      accum.push({ componentName, entityId, properties: [propertyQueryInfo] });
    }
    return accum;
  }, []);
}

export function createTimeSeriesQueries(
  dataSource: TwinMakerDataSource,
  historyQuery: TwinMakerEntityHistoryQuery[]
): TimeSeriesDataQuery[] {
  return historyQuery.map((query) => dataSource.query.timeSeriesData(query));
}

/**
 * Returns the first component of `type` in components of `TwinMakerQueryNodeData`, otherwise undefined.
 */
export function findComponentConfig(
  componentConfigs: ComponentConfig[],
  components: ValueOf<TwinMakerQueryNodeData, 'components'>
) {
  return components.find(({ componentTypeId }) => {
    return getComponentConfigByComponentTypeId(componentConfigs, componentTypeId) !== undefined;
  });
}

/**
 * Returns the component config for `componentTypeId`, otherwise undefined.
 */
export function getComponentConfigByComponentTypeId(componentConfigs: ComponentConfig[], componentTypeId: string) {
  return componentConfigs.find(({ componentTypeId: id }) => id === componentTypeId);
}

export function isEntityWithComponent(entity: Entity): entity is SetRequired<Entity, 'component'> {
  return !isEmpty(entity.component);
}

export function isEntityWithProperties(entity: Entity): entity is RequiredProperties {
  return !isEmpty(entity.component?.properties);
}

export function isEntityWithVideo(entity: Entity): entity is Except<Entity, 'video'> & SetRequired<Entity, 'video'> {
  return !isEmpty(entity.video);
}

export function getAllHistoryQueries(entities: Entity[], type: EntityPropertyType, queryPerProperty = false) {
  return entities.reduce<TwinMakerEntityHistoryQuery[]>((accum, entity) => {
    accum.push(...getEntityHistoryQueries(entity, type, queryPerProperty));
    return accum;
  }, []);
}

export function getEntityHistoryQueries(entity: Entity, type: EntityPropertyType, queryPerProperty = false) {
  if (isEntityWithProperties(entity)) {
    if (queryPerProperty) {
      return createEntityHistoryQueries(entity, type);
    }
    return [createEntityHistoryQuery(entity, type)];
  }
  return [];
}
