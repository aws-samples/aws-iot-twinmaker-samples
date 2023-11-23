// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import cytoscape from 'cytoscape';
import type { SetRequired } from 'type-fest';

import { GRAY_COLORS } from '@iot-prototype-kit/core/css/colors';
import { isNil, isNotNil, isString } from '@iot-prototype-kit/core/utils/lang2';

import { $event } from './events';
import { createSvgString, getPolygonPoints, getSvgSize } from './svg';
import type {
  Core,
  Css,
  EdgeArrowStyleProps,
  EdgeData,
  EdgeDefinition,
  EdgeEndpoint,
  EdgeRenderData,
  EdgeSingular,
  EdgeStyleProps,
  ElementsDefinition,
  EventName,
  EventObjectNode,
  NodeCollection,
  NodeData,
  NodeDefinition,
  NodeRenderData,
  NodeSingular,
  NodeStyleProps,
  Subscriber
} from './types';
import { isNode as _isNode } from './utils';

const EDGE_DEFAULT_STYLE_PROPS: SetRequired<EdgeStyleProps, 'targetArrow'> = {
  color: GRAY_COLORS.Gray11,
  labelBackgroundColor: GRAY_COLORS.Gray11,
  labelTextColor: GRAY_COLORS.Gray50,
  labelTextSize: 13,
  labelOffset: 0,
  labelPadding: 6,
  sourceEndpoint: 'outside-to-node',
  targetArrow: {
    color: GRAY_COLORS.Gray11,
    scale: 1.5,
    shape: 'triangle'
  },
  width: 3
};

const EDGE_HOVER_STYLE_PROPS: EdgeStyleProps = {
  ...EDGE_DEFAULT_STYLE_PROPS,
  color: GRAY_COLORS.White,
  targetArrow: {
    ...EDGE_DEFAULT_STYLE_PROPS.targetArrow,
    color: GRAY_COLORS.White
  },
  width: 3
};

const EDGE_SELECTED_STYLE_PROPS: EdgeStyleProps = {
  ...EDGE_HOVER_STYLE_PROPS,
  width: 6
};

const NODE_DEFAULT_STYLE_PROPS: NodeStyleProps = {
  backgroundColor: GRAY_COLORS.Gray25,
  backgroundImage: getNormalSvg,
  borderColor: GRAY_COLORS.Gray11,
  borderWidth: 5,
  labelTextColor: GRAY_COLORS.Gray11,
  labelTextSize: 16,
  labelOffset: 12,
  labelPadding: 6,
  labelPosition: 'bottom',
  shape: getNodeShape,
  transitionDuration: 300
};

const NODE_HOVER_STYLE_PROPS: NodeStyleProps = {
  ...NODE_DEFAULT_STYLE_PROPS,
  backgroundImage: getHoverSvg,
  borderColor: GRAY_COLORS.White,
  labelTextColor: GRAY_COLORS.White
};

const NODE_SELECTED_STYLE_PROPS: NodeStyleProps = {
  ...NODE_DEFAULT_STYLE_PROPS,
  backgroundImage: getSelectedSvg,
  borderColor: GRAY_COLORS.White,
  borderWidth: 8,
  labelBackgroundColor: GRAY_COLORS.White,
  labelTextColor: GRAY_COLORS.Gray50
};

const nodeNormalStyles = getNodeStyle(NODE_DEFAULT_STYLE_PROPS);
const nodeHoverStyles = getNodeStyle(NODE_HOVER_STYLE_PROPS);
const nodeSelectedStyles = getNodeStyle(NODE_SELECTED_STYLE_PROPS);
const edgeNormalStyles = getEdgeStyle(EDGE_DEFAULT_STYLE_PROPS);
const edgeHoverStyles = getEdgeStyle(EDGE_HOVER_STYLE_PROPS);
const edgeSelectedStyles = getEdgeStyle(EDGE_SELECTED_STYLE_PROPS);

export function createGraph<EntityData>(
  container: HTMLElement,
  {
    canvasPadding,
    elements,
    eventNames = [],
    fitOnLoad = false,
    layout: _layout = 'breadthfirst',
    maxZoom = 2,
    minZoom = 0.1,
    rootElementIds = []
  }: Partial<{
    canvasPadding: number;
    elements: ElementsDefinition;
    eventNames: EventName[];
    fitOnLoad: boolean;
    layout: 'breadthfirst' | 'circle' | 'concentric' | 'grid';
    maxZoom: number;
    minZoom: number;
    rootElementIds: string[];
  }> = {}
) {
  const subscribers = new Set<Subscriber<EntityData>>();

  const commonLayoutOptions = {
    animate: false,
    fit: fitOnLoad,
    nodeDimensionsIncludeLabels: true,
    padding: canvasPadding
  };

  const breadthFirstLayoutOptions = {
    ...commonLayoutOptions,
    grid: true,
    roots: rootElementIds
  };

  const layoutOptions = {
    name: _layout,
    ...breadthFirstLayoutOptions
  };

  type LayoutOptions = Partial<typeof layoutOptions>;

  const cy = cytoscape({
    container,
    elements,
    layout: elements ? layoutOptions : undefined,
    minZoom,
    maxZoom,
    style: [
      { selector: 'node', style: nodeNormalStyles },
      { selector: 'node.hover', style: nodeHoverStyles },
      { selector: 'node:selected', style: nodeSelectedStyles },
      { selector: 'edge', style: edgeNormalStyles },
      { selector: 'edge.hover', style: edgeHoverStyles },
      { selector: 'edge:selected', style: edgeSelectedStyles },
      { selector: 'edge.related-hover', style: edgeHoverStyles },
      { selector: 'edge.related-selected', style: edgeSelectedStyles }
    ]
  });

  cy.on(eventNames.join(' '), (event) => {
    $event.set(event);
  });

  cy.on('mouseover', 'node', ({ target }: EventObjectNode) => {
    if (!target.selected()) target.addClass('hover');
    target.connectedEdges().addClass('related-hover');
  });

  cy.on('mouseout', 'node', ({ target }: EventObjectNode) => {
    target.removeClass('hover');
    target.connectedEdges().removeClass('related-hover');
  });

  cy.on('select', 'node', ({ target }: EventObjectNode) => {
    target.connectedEdges().addClass('related-selected');
  });

  cy.on('unselect', 'node', ({ target }: EventObjectNode) => {
    target.connectedEdges().removeClass('related-selected');
  });

  // public api

  function center(node?: NodeCollection | NodeSingular | string) {
    if (isString(node)) {
      node = cy.nodes(`#${node}`);
    }

    cy.center(node);
  }

  function centerHorizontally() {
    const y = cy.pan().y;
    cy.center();
    cy.pan({ x: cy.pan().x, y });
  }

  function clearGraph() {
    cy.elements().remove();
  }

  function deselectNode(id?: string | null) {
    if (id) {
      cy.nodes().getElementById(id).unselect();
    } else {
      cy.nodes().unselect();
    }
  }

  function dispose() {
    unsubscribeAll();
    cy.unmount();
    cy.destroy();
  }

  function fit(...args: Parameters<typeof cy.fit>) {
    cy.fit(...args);
  }

  function getNode(id: string) {
    return cy.nodes(`#${id}`).first();
  }

  function getNodeBoundingBox(id: string) {
    const node = getNode(id);
    return node.renderedBoundingBox();
  }

  function getZoom() {
    return cy.zoom();
  }

  function isCore(value: Core | EdgeSingular | NodeSingular): value is Core {
    return value === cy;
  }

  function isEdge(value: Core | EdgeSingular | NodeSingular): value is EdgeSingular {
    if (value === cy) {
      return false;
    } else {
      return (value as EdgeSingular | NodeSingular).isEdge();
    }
  }

  function isEdgeRenderData(value?: EdgeRenderData | NodeRenderData<EntityData>): value is EdgeRenderData {
    if (value === undefined) {
      return false;
    } else {
      return isNil(value.entityData);
    }
  }

  function isNode(value: Core | EdgeSingular | NodeSingular): value is NodeSingular {
    return _isNode(cy, value);
  }

  function isNodeRenderData(value?: EdgeRenderData | NodeRenderData<EntityData>): value is NodeRenderData<EntityData> {
    if (value === undefined) {
      return false;
    } else {
      return isNotNil(value.entityData);
    }
  }

  function layout(options: LayoutOptions = {}) {
    cy.layout({ ...layoutOptions, ...options }).run();
  }

  /**
   * Based on: https://github.com/cytoscape/cytoscape.js/issues/2283#issuecomment-461897618
   */
  function nodesInView(nodes: NodeCollection | NodeSingular | string) {
    if (isString(nodes)) {
      nodes = getNode(nodes);
    }
    const bb1 = nodes.boundingBox();
    const bb2 = cy.extent();
    return bb1.x1 > bb2.x1 && bb1.x2 < bb2.x2 && bb1.y1 > bb2.y1 && bb1.y2 < bb2.y2;
  }

  function resize(layoutOptions?: Pick<LayoutOptions, 'fit'>) {
    cy.resize();
    if (layoutOptions) layout(layoutOptions);
  }

  function selectNode(id: string) {
    cy.nodes().unselect();
    const node = getNode(id);
    node.select();
  }

  function setGraphData(elementsDefinition: ElementsDefinition, options: LayoutOptions = {}) {
    clearGraph();

    if (elementsDefinition.nodes.length) {
      cy.add(elementsDefinition);
      layout(options);
    }
  }

  function setNodeData(data: NodeData<EntityData>) {
    cy.nodes().data({ ...data });
  }

  function setZoom(level: number) {
    cy.zoom({ level, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } });
  }

  function subscribe(subscriber: Subscriber<EntityData>) {
    subscribers.add(subscriber);
    return () => unsubscribe(subscriber);
  }

  function updateNodeStyle(id: string, style: Pick<NodeData<EntityData>, 'color' | 'shape'>) {
    const node = getNode(id);
    const currentData = node.data() as NodeRenderData<EntityData>;

    if (currentData) {
      const shouldUpdate = Object.entries(style).some(([key, value]) => {
        return value && value !== currentData[key];
      });

      if (shouldUpdate) {
        const { color, entityData, id, label, shape } = currentData;

        node.data(
          getRenderData(
            { color: style.color ?? color, entityData, id, label, shape: style.shape ?? shape },
            currentData
          )
        );
      }
    }
  }

  function unsubscribe(subscriber: Subscriber<EntityData>) {
    subscribers.delete(subscriber);
  }

  function unsubscribeAll() {
    subscribers.clear();
  }

  return {
    center,
    centerHorizontally,
    clearGraph,
    deselectNode,
    dispose,
    fit,
    getNode,
    getNodeBoundingBox,
    getZoom,
    isCore,
    isEdge,
    isEdgeRenderData,
    isNode,
    isNodeRenderData,
    layout,
    nodesInView,
    resize,
    selectNode,
    setGraphData,
    setNodeData,
    setZoom,
    subscribe,
    updateNodeStyle,
    unsubscribe,
    unsubscribeAll
  };
}

export function getElementsDefinition<EntityData>(
  nodeData: NodeData<EntityData>[],
  edgeData: EdgeData[]
): ElementsDefinition {
  return {
    edges: edgeData.map<EdgeDefinition>((data) => ({
      data: { lineStyle: 'solid', dashPattern: [6, 5], ...data }
    })),

    nodes: nodeData.map<NodeDefinition>((data) => {
      return { data: getRenderData(data) };
    })
  };
}

function getEdgeStyle({
  color,
  curveStyle,
  dashOffset,
  dashPattern,
  endCap,
  labelBackgroundColor,
  labelPadding,
  labelOffset,
  labelTextColor,
  labelTextSize,
  midSourceArrow,
  midTargetArrow,
  opacity,
  sourceArrow,
  sourceEndpoint,
  targetArrow,
  targetEndpoint,
  width
}: EdgeStyleProps): cytoscape.Css.Edge {
  const arrowStyles = Object.entries({
    midSourceArrow,
    midTargetArrow,
    sourceArrow,
    targetArrow
  }).reduce<cytoscape.Css.Edge>((accum, [key, props]) => {
    const arrowKey: Parameters<typeof getEdgeArrowStyle>[0] =
      key === 'midSourceArrow'
        ? 'mid-source'
        : key === 'midTargetArrow'
        ? 'mid-target'
        : key === 'sourceArrow'
        ? 'source'
        : 'target';

    if (props) accum = { ...accum, ...getEdgeArrowStyle(arrowKey, props) };
    return accum;
  }, {});

  return {
    ...arrowStyles,
    color: labelTextColor ?? 'steelblue',
    'font-size': labelTextSize,
    'font-weight': 'normal',
    'line-color': color,
    'curve-style': curveStyle ?? 'straight',
    'line-dash-offset': dashOffset,
    //@ts-ignore
    'line-dash-pattern': 'data(dashPattern)',
    //@ts-ignore
    'line-style': 'data(lineStyle)',
    'line-cap': endCap ?? 'butt',
    'line-opacity': opacity ?? 1,
    'overlay-opacity': 0,
    'source-endpoint': sourceEndpoint ?? getEdgeEndpointStyle('inside-to-node'),
    'target-endpoint': targetEndpoint ?? getEdgeEndpointStyle('outside-to-node'),
    label: 'data(label)',
    // 'source-text-offset': 80,
    'text-background-color': labelBackgroundColor,
    'text-background-opacity': isNil(labelBackgroundColor) ? 0 : 1,
    'text-background-padding': `${labelPadding}px`,
    'text-background-shape': 'roundrectangle',
    width: width
  };
}

function getEdgeArrowStyle(
  key: 'mid-source' | 'mid-target' | 'source' | 'target',
  { color, fill, shape, scale }: EdgeArrowStyleProps
): cytoscape.Css.Edge {
  return {
    'arrow-scale': scale ?? 1,
    [`${key}-arrow-color`]: color,
    [`${key}-arrow-fill`]: fill ?? 'filled',
    [`${key}-arrow-shape`]: shape
  };
}

function getEdgeEndpointStyle(endpoint: EdgeEndpoint) {
  return endpoint;
}

function getHoverSvg(node: NodeSingular) {
  const { hoverSvg } = node.data() as NodeRenderData<unknown>;
  return hoverSvg;
}

function getNodeShape(node: NodeSingular) {
  const { shape } = node.data() as NodeRenderData<unknown>;

  if (isNil(shape)) return 'ellipse';
  if (shape === 'hexagon') return 'polygon';

  return shape;
}

function getNodeStyle({
  backgroundImage,
  backgroundOpacity,
  labelBackgroundColor,
  labelTextColor,
  labelTextSize,
  labelOffset,
  labelPadding,
  labelPosition,
  shape,
  transitionDuration,
  transitionEasing,
  zIndex
}: NodeStyleProps): Css.Node {
  const labelProps: Css.Node = {
    color: labelTextColor ?? 'steelblue',
    'font-size': labelTextSize,
    'font-weight': 'bold',
    label: 'data(label)',
    'line-height': 1,
    'text-background-color': labelBackgroundColor,
    'text-background-opacity': isNil(labelBackgroundColor) ? 0 : 1,
    'text-background-padding': `${labelPadding}px`,
    'text-background-shape': 'roundrectangle',
    'text-border-width': 1,
    'text-halign': labelPosition === 'bottom' || labelPosition === 'top' ? 'center' : labelPosition,
    'text-margin-x': labelPosition === 'left' ? -1 * labelOffset : labelPosition === 'right' ? labelOffset : 0,
    'text-margin-y': labelPosition === 'top' ? -1 * labelOffset : labelPosition === 'bottom' ? labelOffset : 0,
    'text-valign': labelPosition === 'left' || labelPosition === 'right' ? 'center' : labelPosition
  };

  return {
    'background-fit': 'contain',
    'background-image': backgroundImage,
    'background-opacity': backgroundOpacity ?? 0,
    height: 'data(size)',
    'overlay-opacity': 0,
    //@ts-ignore
    shape: shape ?? 'ellipse',
    //@ts-ignore
    'shape-polygon-points': getPolygonPoints,
    'transition-duration': transitionDuration ?? 100,
    'transition-timing-function': transitionEasing ?? 'linear',
    width: 'data(size)',
    'z-index': zIndex ?? 0,
    ...labelProps
  };
}

function getNormalSvg(node: NodeSingular) {
  const { normalSvg } = node.data() as NodeRenderData<unknown>;
  return normalSvg;
}

function getSelectedSvg(node: NodeSingular) {
  const { selectedSvg } = node.data() as NodeRenderData<unknown>;
  return selectedSvg;
}

function getRenderData(
  nodeData: NodeData<unknown>,
  currentRenderData?: NodeRenderData<unknown>
): NodeRenderData<unknown> {
  const renderData = { ...currentRenderData, ...nodeData };
  const size = getSvgSize(renderData.shape);
  return { ...renderData, size, ...getSvgs({ color: renderData.color, shape: renderData.shape, size }) };
}

function getSvgs({ color, size, shape }: Pick<NodeRenderData<unknown>, 'color' | 'size' | 'shape'>) {
  const normalSvg = createSvgString({
    ...NODE_DEFAULT_STYLE_PROPS,
    backgroundColor: color,
    // borderColor: color,
    shape,
    size
  });

  const hoverSvg = createSvgString({
    ...NODE_HOVER_STYLE_PROPS,
    backgroundColor: color,
    shape,
    size
  });

  const selectedSvg = createSvgString({
    ...NODE_SELECTED_STYLE_PROPS,
    backgroundColor: color,
    shape,
    size
  });

  return { normalSvg, hoverSvg, selectedSvg };
}
