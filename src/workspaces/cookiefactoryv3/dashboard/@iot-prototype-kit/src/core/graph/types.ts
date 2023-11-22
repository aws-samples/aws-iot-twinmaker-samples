// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import type {
  CollectionEventName,
  Core,
  Css,
  EdgeDefinition,
  EdgeDataDefinition,
  EdgeSingular,
  ElementsDefinition,
  EventObject,
  EventObjectEdge,
  EventObjectNode,
  GraphEventName,
  NodeCollection,
  NodeDefinition,
  NodeDataDefinition,
  NodeSingular,
  BoundingBox12,
  BoundingBoxWH,
  UserInputDeviceEventName,
  UserInputDeviceEventNameExt
} from 'cytoscape';
import type { ValueOf } from 'type-fest';

export type {
  Core,
  Css,
  EdgeDataDefinition,
  EdgeDefinition,
  EdgeSingular,
  ElementsDefinition,
  EventObject,
  EventObjectEdge,
  EventObjectNode,
  NodeCollection,
  NodeDefinition,
  NodeDataDefinition,
  NodeSingular
};

export type RenderedBoundingBox = BoundingBox12 & BoundingBoxWH;

export type EdgeStyleProps = {
  color: string;
  curveStyle?: ValueOf<cytoscape.Css.Edge, 'curve-style'>;
  dashOffset?: ValueOf<cytoscape.Css.Edge, 'line-dash-offset'>;
  dashPattern?: ValueOf<cytoscape.Css.Edge, 'line-dash-pattern'>;
  endCap?: ValueOf<cytoscape.Css.Edge, 'line-cap'>;
  labelBackgroundColor?: string;
  labelTextColor?: string;
  labelTextSize: number;
  labelOffset: number;
  labelPadding?: number;
  lineStyle?: ValueOf<cytoscape.Css.Edge, 'line-style'>;
  midSourceArrow?: EdgeArrowStyleProps;
  midTargetArrow?: EdgeArrowStyleProps;
  opacity?: number;
  sourceArrow?: EdgeArrowStyleProps;
  sourceEndpoint?: EdgeEndpoint;
  targetArrow?: EdgeArrowStyleProps;
  targetEndpoint?: EdgeEndpoint;
  width: number;
};

export type EdgeArrowStyleProps = {
  color: ValueOf<cytoscape.Css.Edge, 'target-arrow-color'>;
  fill?: ValueOf<cytoscape.Css.Edge, 'target-arrow-fill'>;
  shape: ValueOf<cytoscape.Css.Edge, 'target-arrow-shape'>;
  scale?: ValueOf<cytoscape.Css.Edge, 'arrow-scale'>;
};

export type EdgeData = EdgeDataDefinition & {
  dashPattern?: ValueOf<EdgeStyleProps, 'dashPattern'>;
  id: string;
  label: string;
  lineStyle?: ValueOf<EdgeStyleProps, 'lineStyle'>;
};

export type EdgeRenderData = EdgeData & {};

export type EdgeStyle = Css.LineStyle;

export type EdgeEndpoint =
  | 'outside-to-node'
  | 'outside-to-node-or-label'
  | 'inside-to-node'
  | 'outside-to-line'
  | 'outside-to-line-or-label';

export type NodeData<EntityData> = NodeDataDefinition & {
  color?: string;
  entityData: EntityData;
  id: string;
  label: string;
  shape?: Css.NodeShape;
};

export type NodeShape = Css.NodeShape;

export type NodeRenderData<EntityData> = NodeData<EntityData> & {
  hoverSvg: string;
  normalSvg: string;
  selectedSvg: string;
  size: number;
};

export type NodeStyleProps = {
  backgroundColor?: string;
  backgroundImage?: (node: NodeSingular) => string | string;
  backgroundOpacity?: number;
  borderColor?: string;
  borderWidth: number;
  labelBackgroundColor?: string;
  labelTextColor?: string;
  labelTextSize: number;
  labelOffset: number;
  labelPadding?: number;
  labelPosition: 'top' | 'right' | 'bottom' | 'left';
  shape: (node: NodeSingular) => Css.NodeShape;
  transitionDuration?: number;
  transitionEasing?: ValueOf<cytoscape.Css.Node, 'transition-timing-function'>;
  zIndex?: number;
};

export type Subscriber<EntityData> = (ev: EventDetail<EntityData>) => void;
export type EventDetail<EntityData> = {
  eventName: EventName;
  data?: NodeRenderData<EntityData> | EdgeRenderData;
  target: NodeSingular | EdgeSingular | Core;
};
export type EventName = CollectionEventName | GraphEventName | UserInputDeviceEventName | UserInputDeviceEventNameExt;
