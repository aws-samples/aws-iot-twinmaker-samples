// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import type { Primitive, StyleSettingsMap, TimeSeriesDataQuery, Timestamp } from '@iot-app-kit/core';
import type { initialize, PropertyQueryInfo } from '@iot-app-kit/source-iottwinmaker';
import type { ReactNode } from 'react';
import type { ValueOf } from 'type-fest';

import type { AwsCredentials } from '@/lib/core/auth/cognito';

export type { EntitySummary, IoTTwinMakerClient } from '@aws-sdk/client-iottwinmaker';

export type { Axis } from '@iot-app-kit/charts-core';

export type {
  DataPoint,
  DataStream,
  Primitive,
  StyleSettingsMap,
  Threshold as AppKitThreshold,
  ThresholdSettings,
  ThresholdValue,
  TimeSeriesDataQuery,
  TimeSeriesDataRequestSettings,
  Viewport
} from '@iot-app-kit/core';

export type {
  PropertyQueryInfo,
  SceneLoader,
  TwinMakerEntityHistoryQuery,
  TwinMakerQuery
} from '@iot-app-kit/source-iottwinmaker';

export type DataStreamMetaData = {
  componentName: string;
  entityId: string;
  propertyName: string;
};

export type EntityData = {
  componentName: string;
  entityId: string;
  properties: EntityDataProperty[];
  isRoot?: boolean;
};

export type EntityDataProperty = {
  propertyQueryInfo: PropertyQueryInfo;
  threshold?: Threshold;
  type: EntityPropertyType;
  unit?: string;
};

export type Threshold = { upper: number | null; lower: number | null } | number | boolean;

export type EntityPropertyType = 'alarm' | 'data';

export type Event = {
  date: number;
  id: string;
  message: string;
  name: string;
  status: 'active' | 'suppressed';
  priority: 0 | 1 | 2 | 3 | 'suppressed' | 'none';
  type: 'alarm' | 'info';
};

export type GlobalControl = ReactNode;

export type LatestValue<T extends AlarmState | Primitive> = {
  dataPoint: { x: Timestamp; y: T };
  metaData: DataStreamMetaData;
  threshold?: Threshold;
  trend: 1 | 0 | -1;
  unit?: string;
};

export type AlarmState = 'High' | 'Medium' | 'Low' | 'Normal' | 'Unknown';

export type Panel = {
  content?: ReactNode;
  icon: ReactNode;
  id: 'dashboard' | 'scene' | 'process' | 'live' | 'events' | 'tickets' | 'messages';
  label: string;
  priority: number;
  slot: 1 | 2;
  isVisible: boolean;
};

export type PanelId = ValueOf<Panel, 'id'>;

export type SceneSelectedDataBinding = Record<'entityId' | 'componentName', string>;

export type SelectedEntity = { entityData: EntityData | null; type: 'process' | 'scene' | null };

export type Site = SiteConfig &
  Readonly<{
    health: AlarmState;
  }>;

export type SiteConfig = Readonly<{
  id: string;
  iottwinmaker: Readonly<TwinMakerConfig>;
  location: string;
  name: string;
}>;

export type StateName =
  | 'twinMakerClientState'
  | 'crumbState'
  | 'panelState'
  | 'userState'
  | 'siteState'
  | 'sceneLoaderState'
  | 'selectedEntityState'
  | 'viewState';

export type TwinMakerConfig = {
  workspaceId: string;
  sceneId: string;
};

export type TimeSeriesDataQueries = {
  queries: TimeSeriesDataQuery[];
  styles: StyleSettingsMap;
};

export type TwinMakerDataSource = ReturnType<typeof initialize>;

export type TwinMakerQueryData = {
  rowData: (TwinMakerQueryNodeData | TwinMakerQueryEdgeData)[];
}[];

export type TwinMakerQueryNodeData = {
  arn: string;
  creationDate: number;
  entityId: string;
  entityName: string;
  lastUpdateDate: number;
  workspaceId: string;
  description: string;
  components: {
    componentName: 'CookieLineComponent' | 'ProcessStepComponent';
    componentTypeId: string;
    properties: {
      propertyName: string;
      propertyValue?: string;
    }[];
  }[];
};

export type TwinMakerQueryEdgeData = {
  relationshipName: 'belongTo' | 'feed' | 'flowTo';
  targetEntityId: string;
  sourceComponentName: string;
  sourceEntityId: string;
  sourceComponentTypeId: string;
};

export type User = UserConfig &
  Readonly<{
    awsCredentials?: Readonly<AwsCredentials>;
    icon: ReactNode;
  }>;

export type UserConfig = Readonly<{
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  title: string;
}>;

export type View = {
  content: ReactNode;
  id: 'panel';
};

export type ViewId = ValueOf<View, 'id'>;

// AWS IoT TwinMaker types

export type DataBindingContext = {
  alarm_key: string;
  componentName: string;
  componentTypeId: string;
  entityId: string;
  propertyName: string;
};
