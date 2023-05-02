// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import type {
  EntityData,
  EntityPropertyType,
  TimeSeriesDataQuery,
  TwinMakerDataSource,
  TwinMakerEntityHistoryQuery
} from '@/lib/types';
import type { ValueOf } from 'type-fest';

export function createTimeSeriesQuery(
  dataSource: TwinMakerDataSource,
  historyQuery: TwinMakerEntityHistoryQuery[]
): TimeSeriesDataQuery[] {
  return historyQuery.map((query) => dataSource.query.timeSeriesData(query));
}

export function createHistoryQuery<T extends EntityData>(
  entityData: T,
  propertyType: EntityPropertyType
): TwinMakerEntityHistoryQuery {
  const { componentName, entityId, properties } = entityData;

  const reducedProperties = properties.reduce<ValueOf<TwinMakerEntityHistoryQuery, 'properties'>>(
    (accum, { propertyQueryInfo, type }) => {
      if (type === propertyType) {
        accum.push(propertyQueryInfo);
      }
      return accum;
    },
    []
  );

  return { componentName, entityId, properties: reducedProperties };
}

export function createHistoryQueries<T extends EntityData>(
  entityData: T,
  propertyType: EntityPropertyType
): TwinMakerEntityHistoryQuery[] {
  const { componentName, entityId, properties } = entityData;

  return properties.reduce<TwinMakerEntityHistoryQuery[]>((accum, { propertyQueryInfo, type }) => {
    if (type === propertyType) {
      accum.push({ componentName, entityId, properties: [propertyQueryInfo] });
    }
    return accum;
  }, []);
}
