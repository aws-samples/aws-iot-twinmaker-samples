// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import cytoscape, { EventObject, EventObjectCore, EventObjectEdge } from 'cytoscape';
import type {
  Css,
  EdgeDefinition,
  ElementsDefinition,
  EventObjectNode,
  NodeCollection,
  NodeDefinition,
  NodeSingular
} from 'cytoscape';
// `cytoscape-cise` does not have TypeScript definitions.
//@ts-ignore
import cise from 'cytoscape-cise';
import type { Except, SetRequired, ValueOf } from 'type-fest';

import type { AlarmState } from '@/lib/types';
import { isNil, isString } from '@/lib/utils/lang';
import { GRAPH_COLORS } from './constants';
import { createSvgString, getPolygonPoints, getSvgSize } from './svg';
import type {
  EdgeArrowStyleProps,
  EdgeData,
  EdgeEndpoint,
  EdgeStyleProps,
  EventDetail,
  EventName,
  NodeData,
  NodeRenderData,
  NodeStyleProps,
  Subscriber
} from './types';

const EDGE_DEFAULT_STYLE_PROPS: SetRequired<EdgeStyleProps, 'targetArrow'> = {
  color: GRAPH_COLORS.GRAY_40,
  labelBackgroundColor: GRAPH_COLORS.GRAY_45,
  labelTextColor: GRAPH_COLORS.GRAY_10,
  labelTextSize: 13,
  labelOffset: 0,
  labelPadding: 6,
  sourceEndpoint: 'outside-to-node',
  targetArrow: {
    color: GRAPH_COLORS.GRAY_40,
    scale: 1.5,
    shape: 'triangle'
  },
  width: 3
};

const EDGE_HOVER_STYLE_PROPS: EdgeStyleProps = {
  ...EDGE_DEFAULT_STYLE_PROPS,
  color: GRAPH_COLORS.WHITE,
  targetArrow: {
    ...EDGE_DEFAULT_STYLE_PROPS.targetArrow,
    color: GRAPH_COLORS.WHITE
  },
  width: 3
};

const EDGE_SELECTED_STYLE_PROPS: EdgeStyleProps = {
  ...EDGE_HOVER_STYLE_PROPS,
  width: 6
};

const NODE_DEFAULT_STYLE_PROPS: NodeStyleProps = {
  backgroundImage: getNormalSvg,
  borderWidth: 3,
  labelTextColor: GRAPH_COLORS.GRAY_14,
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
  borderColor: GRAPH_COLORS.WHITE,
  labelTextColor: GRAPH_COLORS.WHITE
};

const NODE_SELECTED_STYLE_PROPS: NodeStyleProps = {
  ...NODE_DEFAULT_STYLE_PROPS,
  backgroundImage: getSelectedSvg,
  borderColor: GRAPH_COLORS.WHITE,
  borderWidth: 6,
  labelBackgroundColor: GRAPH_COLORS.WHITE,
  labelTextColor: GRAPH_COLORS.GRAY_50
};

const nodeNormalStyles = getNodeStyle(NODE_DEFAULT_STYLE_PROPS);
const nodeHoverStyles = getNodeStyle(NODE_HOVER_STYLE_PROPS);
const nodeSelectedStyles = getNodeStyle(NODE_SELECTED_STYLE_PROPS);
const edgeNormalStyles = getEdgeStyle(EDGE_DEFAULT_STYLE_PROPS);
const edgeHoverStyles = getEdgeStyle(EDGE_HOVER_STYLE_PROPS);
const edgeSelectedStyles = getEdgeStyle(EDGE_SELECTED_STYLE_PROPS);

// cytoscape.use(cise);

export function createGraph(
  container: HTMLElement,
  {
    canvasPadding,
    elements,
    fitOnLoad = false,
    maxZoom = 2,
    minZoom = 0.1,
    rootElementIds = []
  }: Partial<{
    canvasPadding: number;
    elements: ElementsDefinition;
    fitOnLoad: boolean;
    maxZoom: number;
    minZoom: number;
    rootElementIds: string[];
  }> = {}
) {
  const subscribers = new Set<Subscriber>();

  const commonLayoutOptions = {
    animate: false,
    fit: fitOnLoad,
    nodeDimensionsIncludeLabels: true,
    padding: canvasPadding
  };

  const ciseLayoutOptions = {
    ...commonLayoutOptions,
    name: 'cise',
    idealInterClusterEdgeLengthCoefficient: 2,
    nodeSeparation: 30
  };

  const breadthFirstLayoutOptions = {
    ...commonLayoutOptions,
    name: 'breadthfirst',
    grid: true,
    roots: rootElementIds
  };

  const layoutOptions = {
    ...breadthFirstLayoutOptions
  };

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

  cy.on('click', ({ target }: EventObjectNode | EventObjectEdge | EventObjectCore) => {
    emitEvent({ eventName: 'click', data: getTargetData(target), target });
  });

  cy.on('mouseover', 'node', ({ target }: EventObjectNode) => {
    if (!target.selected()) target.addClass('hover');
    target.connectedEdges().addClass('related-hover');
    emitEvent({ eventName: 'mouseover', data: getTargetData(target), target });
  });

  cy.on('mouseout', 'node', ({ target }: EventObjectNode) => {
    target.removeClass('hover');
    target.connectedEdges().removeClass('related-hover');
    emitEvent({ eventName: 'mouseout', data: getTargetData(target), target });
  });

  cy.on('resize', ({ target }: EventObjectCore) => {
    emitEvent({ eventName: 'resize', target });
  });

  cy.on('select', 'node', ({ target }: EventObjectNode) => {
    target.connectedEdges().addClass('related-selected');
    emitEvent({ eventName: 'select', data: getTargetData(target), target });
  });

  cy.on('unselect', 'node', ({ target }: EventObjectNode) => {
    target.connectedEdges().removeClass('related-selected');
    emitEvent({ eventName: 'unselect', data: getTargetData(target), target });
  });

  function getTargetData(
    target: ValueOf<EventObjectNode | EventObjectEdge | EventObjectCore, 'target'>
  ): any | undefined {
    const data = target.data();
    if (Object.keys(data).length) {
      return data;
    }
  }

  // public api

  function center(node?: NodeCollection | NodeSingular | string) {
    if (isNil(node)) {
      cy.center();
    } else {
      if (isString(node)) {
        node = cy.nodes(`#${node}`);
      }

      if (!nodesInView(node)) {
        cy.center(node);
      }
    }
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
    return cy.nodes(`#${id}`);
  }

  function getNodeBoundingBox(id: string) {
    const node = getNode(id);
    return node.renderedBoundingBox();
  }

  function getZoom() {
    return cy.zoom();
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

  function resize() {
    cy.resize();
  }

  function selectNode(id: string) {
    cy.nodes().unselect();
    const node = getNode(id);
    node.select();
    center(node);
  }

  function setGraphData(elementsDefinition: ElementsDefinition, options: Partial<typeof layoutOptions> = {}) {
    clearGraph();

    if (elementsDefinition.nodes.length) {
      cy.add(elementsDefinition);
      cy.layout({ ...layoutOptions, ...options }).run();
    }
  }

  function setNodeData(data: NodeData) {
    cy.nodes().data({ ...data, isDirty: true });
  }

  function setZoom(level: number) {
    cy.zoom({ level, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } });
  }

  function subscribe(subscriber: Subscriber) {
    subscribers.add(subscriber);
    return () => unsubscribe(subscriber);
  }

  function updateNode(id: string, data: Partial<Pick<NodeData, 'state' | 'shape'>>) {
    const node = getNode(id);
    const currentData = node.data();
    node.data({ ...currentData, ...data, isDirty: true });
  }

  function unsubscribe(subscriber: Subscriber) {
    subscribers.delete(subscriber);
  }

  function unsubscribeAll() {
    subscribers.clear();
  }

  // private methods

  function emitEvent(ev: EventDetail) {
    subscribers.forEach((subscriber) => {
      subscriber(ev);
    });
  }

  return {
    center,
    clearGraph,
    deselectNode,
    dispose,
    fit,
    getNode,
    getNodeBoundingBox,
    getZoom,
    nodesInView,
    resize,
    selectNode,
    setGraphData,
    setNodeData,
    setZoom,
    subscribe,
    updateNode,
    unsubscribe,
    unsubscribeAll
  };
}

export function getElementsDefinition(nodeData: NodeData[], edgeData: EdgeData[]): ElementsDefinition {
  return {
    edges: edgeData.map<EdgeDefinition>((data) => ({
      data: { lineStyle: 'solid', dashPattern: [6, 5], ...data }
    })),
    nodes: nodeData.map<NodeDefinition>((data) => ({
      data: { ...data, isDirty: true, size: getSvgSize(data.shape) }
    }))
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
  let { hoverSvg, isDirty, size, shape, state } = node.data() as NodeRenderData;

  if (isNil(hoverSvg) || isDirty) {
    hoverSvg = createSvgString({
      ...NODE_HOVER_STYLE_PROPS,
      backgroundColor: getNodeColor(state),
      shape,
      size
    });
    node.data({ hoverSvg: hoverSvg, isDirty: false });
  }

  return hoverSvg;
}

function getNodeColor(state: AlarmState) {
  switch (state) {
    case 'High':
      return GRAPH_COLORS.HEALTH_HIGH;
    case 'Low':
      return GRAPH_COLORS.HEALTH_LOW;
    case 'Medium':
      return GRAPH_COLORS.HEALTH_MEDIUM;
    case 'Normal':
      return GRAPH_COLORS.HEALTH_OK;
    default:
      return GRAPH_COLORS.HEALTH_UNKNOWN;
  }
}

function getNodeShape(node: NodeSingular): Css.NodeShape {
  const { shape } = node.data() as any as NodeRenderData;
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
    'font-weight': 'normal',
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
  let { isDirty, normalSvg, size, shape, state } = node.data() as NodeRenderData;

  if (isNil(normalSvg) || isDirty) {
    normalSvg = createSvgString({
      ...NODE_DEFAULT_STYLE_PROPS,
      backgroundColor: getNodeColor(state),
      borderColor: getNodeColor(state),
      shape,
      size
    });
    node.data({ normalSvg: normalSvg, isDirty: false });
  }

  return normalSvg;
}

function getSelectedSvg(node: NodeSingular) {
  let { isDirty, selectedSvg, size, shape, state } = node.data() as NodeRenderData;

  if (isNil(selectedSvg) || isDirty) {
    selectedSvg = createSvgString({ ...NODE_SELECTED_STYLE_PROPS, backgroundColor: getNodeColor(state), shape, size });
    node.data({ selectedSvg: selectedSvg, isDirty: false });
  }

  return selectedSvg;
}
