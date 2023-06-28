// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import type { SetRequired, ValueOf } from 'type-fest';

import { isNotNil } from '@/lib/core/utils/lang';
import type {
  EntityData,
  EntityPropertyType,
  TimeSeriesDataQuery,
  TwinMakerDataSource,
  TwinMakerEntityHistoryQuery
} from '@/lib/types';

export function createEntityHistoryQuery<T extends SetRequired<EntityData, 'properties'>>(
  entityData: T,
  ...propertyType: EntityPropertyType[]
): TwinMakerEntityHistoryQuery {
  const { componentName, entityId, properties } = entityData;

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

export function createEntityHistoryQueries<T extends SetRequired<EntityData, 'properties'>>(
  entityData: T,
  ...propertyType: EntityPropertyType[]
): TwinMakerEntityHistoryQuery[] {
  const { componentName, entityId, properties } = entityData;

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

export function isEntityWithProperties(entityData: EntityData): entityData is SetRequired<EntityData, 'properties'> {
  return isNotNil(entityData.properties);
}
