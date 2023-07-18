// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { ExecuteQueryCommand } from '@aws-sdk/client-iottwinmaker';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import {
  ALARM_COLORS,
  COMPONENT_NAMES,
  QUERY_ALL_EQUIPMENT_AND_PROCESS_STEPS,
  createQueryByEquipment
} from '@/config/project';
import { KpiChart } from '@/lib/components/charts';
import { FitIcon, MinusIcon, PlusIcon, TargetIcon } from '@/lib/components/svgs/icons';
import { createGraph, eventStore, getElementsDefinition } from '@/lib/core/graph';
import type { EdgeData, EventName, NodeData } from '@/lib/core/graph';
import { createClassName, type ClassName } from '@/lib/core/utils/element';
import { isNil } from '@/lib/core/utils/lang';
import { compareStrings } from '@/lib/core/utils/string';
import { isIgnoredEntity, normalizedEntityData } from '@/lib/init/entities';
import { alarmStateStore, useAlarmStateStore, useLatestValuesStore } from '@/lib/stores/data';
import { selectedStore, useSelectedStore, useSummaryStore } from '@/lib/stores/entity';
import { useHopStore } from '@/lib/stores/graph';
import { useClientStore } from '@/lib/stores/iottwinmaker';
import { hasDashboardStore, panelsStore, usePanelsStore } from '@/lib/stores/panels';
import { useSiteStore } from '@/lib/stores/site';
import type {
  AlarmState,
  EntityData,
  LatestValue,
  TwinMakerQueryData,
  TwinMakerQueryEdgeData,
  TwinMakerQueryNodeData
} from '@/lib/types';
import { Overlay } from './components';

import styles from './styles.module.css';

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

export function ProcessPanel({ className }: { className?: ClassName }) {
  const [alarmState] = useAlarmStateStore();
  const [client] = useClientStore();
  const [hops] = useHopStore();
  const [panels] = usePanelsStore();
  const [selectedEntity, setSelectedEntity] = useSelectedStore();
  const [site] = useSiteStore();
  const [summaries] = useSummaryStore();
  const canvasRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLElement>(null);
  const graphRef = useRef<ReturnType<typeof createGraph<EntityData>> | null>(null);
  const lastKnowledgeGraphQuery = useRef<string | null>(null);
  const panelCount = useRef<number>(panels.size);

  const loadData = useCallback(
    async (queryStatement: string) => {
      if (client && site) {
        const command = new ExecuteQueryCommand({
          queryStatement,
          workspaceId: site.iottwinmaker.workspaceId
        });

        const { rows } = await client.send(command);

        if (rows) {
          const nodeData = new Map<string, NodeData<EntityData>>();
          const edgeData = new Map<string, EdgeData>();

          for await (const { rowData } of rows as TwinMakerQueryData) {
            if (rowData) {
              for await (const item of rowData) {
                if (isTwinMakerQueryNodeData(item)) {
                  const { entityId, components } = item;

                  if (!isIgnoredEntity(entityId)) {
                    const component = components.find(
                      ({ componentName }) =>
                        componentName === COMPONENT_NAMES.Equipment || componentName === COMPONENT_NAMES.ProcessStep
                    );

                    if (component) {
                      const { componentName } = component;
                      const entityData: EntityData = normalizedEntityData.find(
                        ({ entityId: id }) => id === entityId
                      ) ?? {
                        entityId,
                        componentName,
                        name: 'Unknown',
                        properties: []
                      };

                      nodeData.set(entityId, {
                        color: getNodeColor('Unknown'),
                        entityData,
                        id: entityId,
                        label: entityData.name,
                        shape: componentName === COMPONENT_NAMES.Equipment ? 'hexagon' : 'ellipse'
                      });
                    }
                  }
                }

                if (isTwinMakerQueryEdgeData(item)) {
                  const { relationshipName, sourceEntityId, targetEntityId } = item;

                  if (!isIgnoredEntity(sourceEntityId) && !isIgnoredEntity(targetEntityId)) {
                    const id = `${sourceEntityId}-${targetEntityId}`;
                    const lineStyle = relationshipName === 'belongTo' ? 'dashed' : 'solid';

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
          }

          return { edgeData, nodeData };
        }
      }
    },
    [client, site]
  );

  const executeQuery = useCallback(
    async (selectedEntityId?: string) => {
      if (graphRef.current) {
        const knowledgeGraphQuery =
          hops !== -1 && selectedEntityId
            ? createQueryByEquipment(selectedEntityId, hops)
            : QUERY_ALL_EQUIPMENT_AND_PROCESS_STEPS;

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

        setAlarmState(graphRef.current, alarmStateStore.getState());

        if (selectedEntityId) {
          graphRef.current.selectNode(selectedEntityId);

          if (!graphRef.current.nodesInView(selectedEntityId)) {
            graphRef.current.center(selectedEntityId);
          }
        }
      }
    },
    [hops]
  );

  const handleCenter = useCallback(() => {
    const { entityData } = selectedStore.getState();
    graphRef.current?.center(entityData?.entityId);
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
    if (!hasDashboardStore.getState()) {
      return <KpiCharts />;
    }
    return null;
  }, [panels]);

  useEffect(() => {
    if (graphRef.current) {
      if (selectedEntity.entityData) {
        if (selectedEntity.type !== 'process') {
          executeQuery(selectedEntity.entityData.entityId);
        }
      } else {
        graphRef.current.deselectNode();
        executeQuery();
      }
    }
  }, [selectedEntity, executeQuery]);

  useEffect(() => {
    const summaryList = Object.values(summaries);

    if (canvasRef.current && summaryList.length) {
      const rootIds = normalizedEntityData.reduce<string[]>((accum, { entityId, isRoot }) => {
        if (isRoot) {
          accum.push(entityId);
        }
        return accum;
      }, []);

      const graph = createGraph<EntityData>(canvasRef.current, {
        canvasPadding: GRAPH_CANVAS_PADDING,
        eventNames: EVENT_NAMES,
        fitOnLoad: true,
        rootElementIds: rootIds
      });

      const unsubscribeEventStore = eventStore.subscribe((getState) => {
        const event = getState();

        if (event) {
          const { target, type } = event;

          switch (type) {
            case 'click': {
              const data = target.data();
              const { entityData } = selectedStore.getState();

              if (graph.isNodeRenderData(data)) {
                if (isNil(entityData) || (entityData && entityData.entityId !== data.entityData.entityId)) {
                  const { entityData } = data;
                  const { entityId } = entityData;

                  if (!graph.nodesInView(entityId)) {
                    graph.center(entityId);
                  }

                  setSelectedEntity({ entityData, type: 'process' });
                }
              } else {
                if (entityData) {
                  setSelectedEntity({ entityData: null, type: 'process' });
                }
              }

              break;
            }

            case 'resize': {
              const panels = panelsStore.getState();
              const { entityData } = selectedStore.getState();

              if (panelCount.current !== panels.size) {
                panelCount.current = panels.size;
                graphRef.current?.centerHorizontally();
              }

              if (entityData) {
                const { entityId } = entityData;

                if (!graph.nodesInView(entityId)) {
                  graph.center(entityId);
                }
              }

              break;
            }
          }
        }
      });

      graphRef.current = graph;

      return () => {
        unsubscribeEventStore();
        graph.dispose();
      };
    }
  }, [summaries]);

  useEffect(() => {
    if (graphRef.current) {
      setAlarmState(graphRef.current, alarmState);
    }
  }, [alarmState]);

  useEffect(() => {
    if (kpis) {
      graphRef.current?.resize();
    }
  }, [kpis]);

  useEffect(() => {
    const { entityData } = selectedStore.getState();
    executeQuery(entityData?.entityId);
  }, []);

  return (
    <main className={createClassName(styles.root, className)}>
      <section className={styles.canvasContainer} ref={containerRef}>
        <section ref={canvasRef} className={styles.canvas} />
        <section className={styles.overlay}>
          <Overlay />
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
    </main>
  );
}

function KpiCharts() {
  const [alarms] = useAlarmStateStore();
  const [latestValuesMap] = useLatestValuesStore();
  const [selectedEntity] = useSelectedStore();

  const kpiElements = useMemo(() => {
    const { entityData } = selectedEntity;

    if (entityData) {
      const { entityId } = entityData;
      const alarmValue = alarms[entityId];
      const latestValues = latestValuesMap[entityId];

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
  }, [selectedEntity, alarms, latestValuesMap]);

  return useMemo(() => {
    if (kpiElements) {
      return (
        <section className={styles.kpis} data-kpi-count={kpiElements.length}>
          {kpiElements.length ? kpiElements : getEmptyStateMessage(selectedEntity.entityData)}
        </section>
      );
    }

    return null;
  }, [kpiElements, selectedEntity]);
}

function getEmptyStateMessage(entityData: EntityData | null) {
  const append = entityData ? ` for ${entityData.name}` : '';
  return `No data available${append}`;
}

function getNodeColor(state: AlarmState) {
  switch (state) {
    case 'High':
      return ALARM_COLORS.High;
    case 'Low':
      return ALARM_COLORS.Low;
    case 'Medium':
      return ALARM_COLORS.Medium;
    case 'Normal':
      return ALARM_COLORS.NormalGray;
    default:
      return ALARM_COLORS.Unknown;
  }
}

function isTwinMakerQueryEdgeData(item: any): item is TwinMakerQueryEdgeData {
  return item.relationshipName !== undefined;
}

function isTwinMakerQueryNodeData(item: any): item is TwinMakerQueryNodeData {
  return item.entityId !== undefined;
}

function setAlarmState(
  graph: ReturnType<typeof createGraph<EntityData>>,
  alarmState: Record<string, LatestValue<AlarmState>>
) {
  Object.entries(alarmState).forEach(([entityId, state]) => {
    graph.updateNodeStyle(entityId, { color: getNodeColor(state.dataPoint.y) });
  });
}
