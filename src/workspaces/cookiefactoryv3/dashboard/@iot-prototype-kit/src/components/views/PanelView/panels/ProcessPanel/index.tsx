// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { ExecuteQueryCommand } from '@aws-sdk/client-iottwinmaker';
import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';

import { Panel, type PanelProps } from '@iot-prototype-kit/components/Panel';
import { KpiChart } from '@iot-prototype-kit/components/charts/KpiChart';
import { FitIcon } from '@iot-prototype-kit/components/svgs/icons/FitIcon';
import { MinusIcon } from '@iot-prototype-kit/components/svgs/icons/MinusIcon';
import { PlusIcon } from '@iot-prototype-kit/components/svgs/icons/PlusIcon';
import { TargetIcon } from '@iot-prototype-kit/components/svgs/icons/TargetIcon';
import { createGraph, getElementsDefinition } from '@iot-prototype-kit/core/graph';
import { $event } from '@iot-prototype-kit/core/graph/events';
import type { EdgeData, EventName, NodeData, NodeSingular } from '@iot-prototype-kit/core/graph/types';
import { useStore } from '@iot-prototype-kit/core/store';
import { createClassName } from '@iot-prototype-kit/core/utils/element';
import { isNil } from '@iot-prototype-kit/core/utils/lang2';
import { compareStrings } from '@iot-prototype-kit/core/utils/string';
import { $alarmValues, $entitiesLatestValues } from '@iot-prototype-kit/stores/data';
import { $entityList, $selectedEntity } from '@iot-prototype-kit/stores/entity';
import { $client } from '@iot-prototype-kit/stores/iottwinmaker';
import { $openFlexPanels } from '@iot-prototype-kit/stores/panel';
import { $site } from '@iot-prototype-kit/stores/site';
import type {
  AlarmState,
  Entity,
  LatestValue,
  TwinMakerQueryData,
  TwinMakerQueryEdgeData,
  TwinMakerQueryNodeData
} from '@iot-prototype-kit/types';
import { getAppKitConfig, getTwinMakerConfig } from '@iot-prototype-kit/utils/config';
import { getAlarmByValue } from '@iot-prototype-kit/utils/data';

import { Overlay } from './components/Overlay';

import styles from './styles.module.css';

const QUERY_ALL_EQUIPMENT_AND_PROCESS_STEPS = `
  SELECT processStep, r1, e, r2, equipment
  FROM EntityGraph
  MATCH (cookieLine)<-[:isChildOf]-(processStepParent)<-[:isChildOf]-(processStep)-[r1]-(e)-[r2]-(equipment), equipment.components AS c
  WHERE cookieLine.entityName = 'COOKIE_LINE'
  AND processStepParent.entityName = 'PROCESS_STEP'
  AND c.componentTypeId = 'com.example.cookiefactory.equipment'`;

const EVENT_NAMES: EventName[] = [
  'click',
  'cxtdrag',
  'cxtdragout',
  'cxtdragover',
  'cxttap',
  'cxttapend',
  'cxttapstart',
  'drag',
  'free',
  'mousemove',
  'mouseover',
  'mouseout',
  'resize',
  'select',
  'unselect',
  'viewport'
];

const GRAPH_CANVAS_PADDING = 30;

type ProcessPanelProps = PanelProps<{
  dashboardPanelId?: string;
  overlayContent: (node: NodeSingular) => ReactNode;
}>;

export function ProcessPanel({ className, dashboardPanelId, overlayContent, ...props }: ProcessPanelProps) {
  const alarmValues = useStore($alarmValues);
  const client = useStore($client);
  const entityList = useStore($entityList);
  const flexPanels = useStore($openFlexPanels);
  const selectedEntity = useStore($selectedEntity);
  const site = useStore($site);
  const twinMakerConfig = getTwinMakerConfig();
  const containerRef = useRef<HTMLElement>(null);
  const graphRef = useRef<ReturnType<typeof createGraph<Entity>> | null>(null);
  const lastKnowledgeGraphQuery = useRef<string | null>(null);
  const panelCount = useRef<number>(flexPanels.length);

  const canvasRef = useCallback((canvas: HTMLElement | null) => {
    if (canvas) {
      const rootIds = entityList.reduce<string[]>((accum, { entityId, isRoot }) => {
        if (isRoot) {
          accum.push(entityId);
        }
        return accum;
      }, []);

      const graph = createGraph<Entity>(canvas, {
        canvasPadding: GRAPH_CANVAS_PADDING,
        eventNames: EVENT_NAMES,
        fitOnLoad: true,
        rootElementIds: rootIds
      });

      graphRef.current = graph;
    }
  }, []);

  const loadData = useCallback(
    async (queryStatement: string) => {
      if (client && site) {
        const command = new ExecuteQueryCommand({
          queryStatement,
          workspaceId: site.aws.iot.twinMaker.workspaceId
        });

        const { rows } = await client.send(command);

        if (rows) {
          const nodeData = new Map<string, NodeData<Entity>>();
          const edgeData = new Map<string, EdgeData>();

          for await (const { rowData } of rows as TwinMakerQueryData) {
            if (rowData) {
              for await (const item of rowData) {
                if (isTwinMakerQueryNodeData(item)) {
                  const { entityId } = item;

                  const entity: Entity = entityList.find((entity) => entity.entityId === entityId) ?? {
                    entityId,
                    metadata: {
                      displayName: 'Unknown'
                    }
                  };

                  nodeData.set(entityId, {
                    color: getNodeColor('unknown'),
                    entityData: entity,
                    id: entityId,
                    label: entity.metadata.displayName,
                    shape: entity.visualization?.graph?.style ?? 'ellipse'
                  });
                }

                if (isTwinMakerQueryEdgeData(item)) {
                  const { relationshipName, sourceEntityId, targetEntityId } = item;
                  const id = `${sourceEntityId}-${targetEntityId}`;

                  const relationshipConfigs = twinMakerConfig?.relationshipConfigs ?? [];

                  const relationshipConfig = relationshipConfigs.find(
                    (config) => config.relationshipName === relationshipName
                  );

                  const lineStyle = relationshipConfig?.graph?.style?.lineStyle ?? 'solid';

                  edgeData.set(id, {
                    id,
                    label: relationshipName,
                    lineStyle,
                    source: sourceEntityId,
                    target: targetEntityId
                  });
                }
              }
            }
          }

          return { edgeData, nodeData };
        }
      }
    },
    [client, site, entityList]
  );

  const executeQuery = useCallback(async (selectedEntityId?: string) => {
    if (graphRef.current) {
      const knowledgeGraphQuery = QUERY_ALL_EQUIPMENT_AND_PROCESS_STEPS;

      if (knowledgeGraphQuery !== lastKnowledgeGraphQuery.current) {
        const data = await loadData(knowledgeGraphQuery);

        if (data) {
          graphRef.current.setGraphData(
            getElementsDefinition([...data.nodeData.values()], [...data.edgeData.values()]),
            {
              fit: true
            }
          );

          lastKnowledgeGraphQuery.current = knowledgeGraphQuery;
        }
      }

      setAlarmValue(graphRef.current, $alarmValues.get());

      if (selectedEntityId) {
        graphRef.current.selectNode(selectedEntityId);

        if (!graphRef.current.nodesInView(selectedEntityId)) {
          graphRef.current.center(selectedEntityId);
        }
      }
    }
  }, []);

  const handleCenter = useCallback(() => {
    graphRef.current?.center($selectedEntity.get().entity?.entityId);
  }, []);

  const handleFit = useCallback(() => {
    graphRef.current?.fit(undefined, GRAPH_CANVAS_PADDING);
  }, []);

  const handleZoomIn = useCallback(() => {
    if (graphRef.current) {
      const currentScale = graphRef.current.getZoom();
      graphRef.current.setZoom(currentScale + 0.1);
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (graphRef.current) {
      const currentScale = graphRef.current.getZoom();
      graphRef.current.setZoom(currentScale - 0.1);
    }
  }, []);

  const kpis = useMemo(() => {
    if (!dashboardPanelId || !flexPanels.includes(dashboardPanelId)) {
      return <KpiCharts />;
    }
    return null;
  }, [dashboardPanelId, flexPanels]);

  useEffect(() => {
    const unsubscribeEventStore = $event.listen((event) => {
      if (event && graphRef.current) {
        const { target, type } = event;

        switch (type) {
          case 'click': {
            const data = target.data();
            const { entity } = $selectedEntity.get();

            if (graphRef.current.isNodeRenderData(data)) {
              const { entityData } = data;

              if (isNil(entity) || entity.entityId !== entityData.entityId) {
                if (!graphRef.current.nodesInView(entityData.entityId)) {
                  graphRef.current.center(entityData.entityId);
                }

                $selectedEntity.set({ entity: entityData, originId: props.id });
              }
            } else {
              graphRef.current.deselectNode();
              executeQuery();

              $selectedEntity.set({ entity: null, originId: props.id });
            }

            break;
          }

          case 'resize': {
            const flexPanels = $openFlexPanels.get();
            const { entity } = $selectedEntity.get();

            if (panelCount.current !== flexPanels.length) {
              panelCount.current = flexPanels.length;
              graphRef.current.centerHorizontally();
            }

            if (entity) {
              const { entityId } = entity;

              if (!graphRef.current.nodesInView(entityId)) {
                graphRef.current.center(entityId);
              }
            }

            break;
          }
        }
      }
    });

    return () => {
      unsubscribeEventStore();
      graphRef.current?.dispose();
    };
  }, [props.id]);

  useEffect(() => {
    if (graphRef.current) {
      setAlarmValue(graphRef.current, alarmValues);
    }
  }, [alarmValues]);

  useEffect(() => {
    if (kpis) {
      graphRef.current?.resize();
    }
  }, [kpis]);

  // Update graph if `selectedEntity` set by an external component
  useEffect(() => {
    if (graphRef.current && selectedEntity.originId !== props.id) {
      if (selectedEntity.entity) {
        executeQuery(selectedEntity.entity.entityId);
      } else {
        graphRef.current.deselectNode();
        executeQuery();
      }
    }
  }, [props.id, selectedEntity]);

  // Create graph on load
  useEffect(() => {
    const { entity } = $selectedEntity.get();
    executeQuery(entity?.entityId);
  }, []);

  return (
    <Panel className={createClassName(styles.root, className)} {...props}>
      <section className={styles.canvasContainer} ref={containerRef}>
        <section ref={canvasRef} className={styles.canvas} />
        <section className={styles.overlay}>
          <Overlay content={overlayContent} />
        </section>
        <section className={styles.controls}>
          <button className={styles.button} onPointerUp={handleFit}>
            <FitIcon className={styles.buttonFitIcon} />
          </button>
          <button className={styles.button} onPointerUp={handleCenter}>
            <TargetIcon className={styles.buttonCenterIcon} />
          </button>
          <button className={styles.button} onPointerUp={handleZoomIn}>
            <PlusIcon className={styles.buttonZoomInIcon} />
          </button>
          <button className={styles.button} onPointerUp={handleZoomOut}>
            <MinusIcon className={styles.buttonZoomOutIcon} />
          </button>
        </section>
      </section>
      {kpis}
    </Panel>
  );
}

function KpiCharts() {
  const alarms = useStore($alarmValues);
  const entitiesLatestValues = useStore($entitiesLatestValues);
  const selectedEntity = useStore($selectedEntity);

  const kpiElements = useMemo(() => {
    if (selectedEntity.entity) {
      const { entityId } = selectedEntity.entity;
      const alarmValue = alarms[entityId];
      const latestValues = entitiesLatestValues[entityId];

      if (latestValues) {
        return Object.values(latestValues)
          .sort((a, b) => compareStrings(a.metaData.propertyName, b.metaData.propertyName))
          .map((latestValue) => {
            return (
              <KpiChart
                alarmValue={alarmValue}
                className={styles.kpi}
                key={`${latestValue.metaData.entityId}-${latestValue.metaData.propertyName}`}
                latestValue={latestValue}
              />
            );
          });
      }

      return [];
    }

    return null;
  }, [selectedEntity, alarms, entitiesLatestValues]);

  return useMemo(() => {
    if (kpiElements) {
      return (
        <section className={styles.kpis} data-kpi-count={kpiElements.length}>
          {kpiElements.length ? kpiElements : getEmptyStateMessage(selectedEntity.entity)}
        </section>
      );
    }

    return null;
  }, [kpiElements, selectedEntity]);
}

function getEmptyStateMessage(entity: Entity | null) {
  const append = entity ? ` for ${entity.metadata.displayName}` : '';
  return `No data available${append}`;
}

function getNodeColor(alarmState?: AlarmState) {
  if (alarmState) {
    const alarms = getAppKitConfig()?.visualization?.alarms;
    if (alarms) return alarms[alarmState].color;
  }
  return 'cyan';
}

function isTwinMakerQueryEdgeData(item: any): item is TwinMakerQueryEdgeData {
  return item.relationshipName !== undefined;
}

function isTwinMakerQueryNodeData(item: any): item is TwinMakerQueryNodeData {
  return item.entityId !== undefined;
}

function setAlarmValue(
  graph: ReturnType<typeof createGraph<Entity>>,
  alarmValues: Record<string, LatestValue<string>>
) {
  Object.entries(alarmValues).forEach(([entityId, state]) => {
    const alarmState = getAlarmByValue<AlarmState>(state.dataPoint.y);
    graph.updateNodeStyle(entityId, { color: getNodeColor(alarmState) });
  });
}
