// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import type { EntitySummary as _EntitySummary } from '@aws-sdk/client-iottwinmaker';
import type {
  ComparisonOperator,
  DurationViewport,
  Primitive,
  TimeSeriesDataRequestSettings,
  Timestamp,
  Viewport
} from '@iot-app-kit/core';
import type { CameraControlMode, ExternalLibraryConfig, SceneViewerConfig } from '@iot-app-kit/scene-composer';
import type { initialize, PropertyQueryInfo } from '@iot-app-kit/source-iottwinmaker';
import type { ReactNode } from 'react';
import type { Except, LiteralUnion } from 'type-fest';

import type { AwsCredentials, CognitoAuthenticatedFlowConfig } from '@iot-prototype-kit/core/auth/cognito';
import type { EdgeStyleProps, NodeShape } from '@iot-prototype-kit/core/graph/types';

export type { IoTTwinMakerClient } from '@aws-sdk/client-iottwinmaker';
export type { Axis } from '@iot-app-kit/charts-core';

export type {
  DataPoint,
  DataStream,
  DurationViewport,
  HistoricalViewport,
  Primitive,
  StyleSettingsMap,
  Threshold as AppKitThreshold,
  ThresholdSettings,
  ThresholdValue,
  TimeSeriesDataQuery,
  TimeSeriesDataRequestSettings,
  Viewport
} from '@iot-app-kit/core';

export type { ExternalLibraryConfig } from '@iot-app-kit/scene-composer';

export type {
  PropertyQueryInfo,
  SceneLoader,
  TwinMakerEntityHistoryQuery,
  TwinMakerQuery,
  TwinMakerSceneMetadataModule
} from '@iot-app-kit/source-iottwinmaker';

export type {
  AwsCredentials,
  AuthenticatedUserConfig,
  CognitoAuthenticatedFlowConfig
} from '@iot-prototype-kit/core/auth/cognito';

export type DataStreamMetaData = {
  componentName: string;
  entityId: string;
  propertyName: string;
};

export type Entity = {
  component?: {
    componentName: string;
    properties?: EntityDataProperty[];
  };
  entityId: string;
  images?: string[];
  isRoot?: boolean;
  metadata: {
    description?: string;
    displayName: string;
  };
  video?: {
    componentName: string;
    initialViewport: Viewport;
  };
  visualization?: {
    graph?: {
      color?: string;
      style?: GraphNodeShape;
    };
  };
};

export type GraphEdgeStyleProps = Partial<EdgeStyleProps>;
export type GraphNodeShape = Extract<NodeShape, 'diamond' | 'ellipse' | 'hexagon' | 'rectangle'>;

export type EntityConfig = {
  component?: {
    componentName: string;
    properties?: EntityDataProperty[];
  };
  entityId: string;
  images?: string[];
  isRoot?: boolean;
  metadata?: {
    description?: string;
    displayName?: string;
  };
  video?: {
    componentName: string;
    initialViewport: Viewport;
  };
  visualization?: {
    graph?: {
      color?: string;
      style?: GraphNodeShape;
    };
  };
};

export type EntityDataProperty = {
  chartType: 'line' | 'status';
  displayName?: string;
  isTimeSeries?: boolean;
  propertyQueryInfo: PropertyQueryInfo;
  threshold?: Threshold;
  scope?: 'global' | 'entity';
  computeTrend?: boolean;
  type?: EntityPropertyType;
  unit?: string;
};

export type Threshold = { upper: number | null; lower: number | null } | number | boolean;

export type EntityPropertyType = 'alarm-message' | 'alarm-state' | 'data';

export type Trend = 1 | 0 | -1;

export type EntitiesLatestValues = Record<string, LatestValues>;
export type LatestValues = { [key: string]: LatestValue<Primitive> };

export type LatestValue<T extends Primitive> = {
  dataPoint: { x: Timestamp; y: T };
  displayName: string;
  metaData: DataStreamMetaData;
  threshold?: Threshold;
  trend?: Trend;
  unit?: string;
};

export type SelectedEntity = { entity: Entity | null; originId: string | null };

export type PanelConfig = {
  button: {
    icon: ReactNode;
    label: string;
  };
  element?: ReactNode | ((config: PanelConfig) => ReactNode);
  id: string;
  layer?: boolean;
  onClose?: () => void;
};

export type Site = SiteConfig;

export type SiteConfig = Readonly<{
  aws: {
    iot: {
      appkit?: AwsConfig.Iot.AppKit;
      twinMaker: AwsConfig.Iot.TwinMaker;
    };
  };
  description?: ReactNode;
  events?: {
    createEventMessage(entity: Entity, message: Primitive): { subject: string; message: string };
  };
  icon?: ReactNode;
  id: string;
  menuItem?: ReactNode;
  name: ReactNode;
  routes: RouteConfig[];
}>;

export type RouteConfig = {
  id: string;
  path: '/' | string;
  view: ReactNode;
};

// export type AlarmState = keyof Alarms;

// export type Alarms<T extends { [key: string]: Alarm } = {}> = {
//   [key: string]: Alarm;
//   normal: Alarm;
//   unknown: Alarm;
// } & T;

export type AlarmState = 'normal' | 'unknown';
export type Alarms<T extends { [key: string]: Alarm } = {}> = Record<AlarmState, Alarm> & T;

export type Alarm = {
  color: string;
  comparisonOperator: ComparisonOperator;
  label: { text: string; show: boolean };
  showInLegend?: boolean;
  value: string;
};

export namespace AwsConfig {
  export namespace Iot {
    export type AppKit = {
      sceneViewer?: {
        activeCamera?: CameraConfig;
        cameraControlMode?: CameraControlMode;
        config?: SceneViewerConfig;
        externalLibraryConfig?: ExternalLibraryConfig;
      };
      timeSeriesData?: {
        /**
         * See https://awslabs.github.io/iot-app-kit/?path=/docs/react-hooks-usetimeseriesdata--docs#kitchen-sink-example-utilization-with-all-features
         */
        requestSettings?: TimeSeriesDataRequestSettings;
        viewport?: DurationViewport;
      };
      visualization?: {
        alarms?: Alarms;
        data?: VisualizationData[];
      };
    };

    export type TwinMaker = {
      cameras?: CameraConfig[];
      entityConfigs: EntityConfig[];
      relationshipConfigs?: RelationshipConfig[];
      sceneId: string;
      videoConfigs?: VideoConfig[];
      workspaceId: string;
    };
  }
}

export type CameraConfig = {
  displayName: string;
  id: string;
  isPlaceholder?: boolean;
  isSelected?: boolean;
  menuDisplayName?: string;
};

export type ComponentConfig = {
  componentName: string;
  componentTypeId: string;
  graph?: {
    color?: string;
    style?: GraphNodeShape;
  };
};

export type RelationshipConfig = {
  relationshipName: string;
  graph?: {
    style?: Pick<GraphEdgeStyleProps, 'lineStyle'>;
  };
};

export type VideoConfig = {
  entityId?: string;
  kvsStreamName: string;
  title: string;
  viewport: { start: Date; end: Date };
};

export type VisualizationData = {
  color: string;
  id: string;
  label?: string;
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
    componentName: string;
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

export type User = Except<UserConfig, 'cognito' | 'password'> &
  Readonly<{
    awsCredentials: Readonly<AwsCredentials>;
    id: string;
  }>;

export type UserConfig = Readonly<{
  cognito: CognitoAuthenticatedFlowConfig;
  siteConfigs: SiteConfig[];
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  title: string;
  avatar?: ReactNode;
}>;

export type AppConfig = {
  branding?: ReactNode;
  statusBarComponents?: ReactNode | ReactNode[];
  userConfigs: UserConfig[];
};
