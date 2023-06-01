// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { ExecuteQueryCommand } from '@aws-sdk/client-iottwinmaker';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { COMPONENT_NAMES, QUERY_ALL_EQUIPMENT_AND_PROCESS_STEPS, createQueryByEquipment } from '@/config/project';
import { KpiChart } from '@/lib/components/charts';
import { FitIcon, MinusIcon, PlusIcon, TargetIcon } from '@/lib/components/svgs/icons';
import { createGraph, eventStore, getElementsDefinition } from '@/lib/core/graph';
import type { EdgeData, EventName, NodeData } from '@/lib/core/graph';
import { createClassName, type ClassName } from '@/lib/core/utils/element';
import { compareStrings } from '@/lib/core/utils/string';
import { isIgnoredEntity, normalizedEntityData } from '@/lib/init/entities';
import { alarmStore, useAlarmStore, useLatestValuesStore } from '@/lib/stores/data';
import { selectedStore, useSelectedStore, useSummaryStore } from '@/lib/stores/entity';
import { useHopStore } from '@/lib/stores/graph';
import { useClientStore } from '@/lib/stores/iottwinmaker';
import { useHasDashboardStore, usePanelsStore } from '@/lib/stores/panels';
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
  const [alarmState] = useAlarmStore();
  const [client] = useClientStore();
  const hasDashboard = useHasDashboardStore();
  const [hops] = useHopStore();
  const [panels] = usePanelsStore();
  const [selectedEntity, setSelectedEntity] = useSelectedStore();
  const [site] = useSiteStore();
  const [summaries] = useSummaryStore();
  const [graph, setGraph] = useState<ReturnType<typeof createGraph<EntityData>>>();
  const canvasRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLElement>(null);
  const lastKnowledgeGraphQuery = useRef<string | null>(null);

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
                        entityData,
                        id: entityId,
                        label: entityData.name,
                        shape: componentName === COMPONENT_NAMES.Equipment ? 'hexagon' : 'ellipse',
                        state: 'Unknown'
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
      if (graph) {
        const knowledgeGraphQuery =
          hops !== -1 && selectedEntityId
            ? createQueryByEquipment(selectedEntityId, hops)
            : QUERY_ALL_EQUIPMENT_AND_PROCESS_STEPS;

        if (knowledgeGraphQuery !== lastKnowledgeGraphQuery.current) {
          const data = await loadData(knowledgeGraphQuery);

          if (data) {
            graph.setGraphData(getElementsDefinition([...data.nodeData.values()], [...data.edgeData.values()]), {
              fit: true
            });

            graph.center();

            lastKnowledgeGraphQuery.current = knowledgeGraphQuery;
          }
        }

        setAlarmState(graph, alarmStore.getState());

        if (selectedEntityId) {
          graph.selectNode(selectedEntityId);
        }
      }
    },
    [graph, hops]
  );

  const handleCenter = useCallback(() => {
    graph?.center();
  }, [graph]);

  const handleFit = useCallback(() => {
    graph?.fit(undefined, GRAPH_CANVAS_PADDING);
  }, [graph]);

  const handleZoomIn = useCallback(() => {
    if (graph) {
      const currentScale = graph.getZoom();
      graph.setZoom(currentScale + 0.1);
    }
  }, [graph]);

  const handleZoomOut = useCallback(() => {
    if (graph) {
      const currentScale = graph.getZoom();
      graph.setZoom(currentScale - 0.1);
    }
  }, [graph]);

  const kpis = useMemo(() => {
    if (!hasDashboard) {
      return <KpiCharts />;
    }
    return null;
  }, [panels]);

  useEffect(() => {
    if (graph) {
      if (selectedEntity.entityData) {
        if (selectedEntity.type !== 'process') {
          executeQuery(selectedEntity.entityData.entityId);
        }
      } else {
        graph.deselectNode();
        executeQuery();
      }
    }
  }, [graph, selectedEntity, executeQuery]);

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
              if (graph.isNodeRenderData(data)) {
                const { entityData } = data;
                setSelectedEntity({ entityData, type: 'process' });

                const { entityId } = entityData;

                if (!graph.nodesInView(entityId)) {
                  graph.center(entityId);
                }
              } else {
                setSelectedEntity({ entityData: null, type: 'process' });
              }
              break;
            }
            case 'resize': {
              const { entityData } = selectedStore.getState();

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

      setGraph(graph);

      return () => {
        unsubscribeEventStore();
        graph.dispose();
      };
    }
  }, [summaries]);

  useEffect(() => {
    if (graph) {
      setAlarmState(graph, alarmState);
    }
  }, [graph, alarmState]);

  useEffect(() => {
    graph?.resize({ fit: true });
  }, [graph, panels]);

  useEffect(() => {
    const { entityData } = selectedStore.getState();
    executeQuery(entityData?.entityId);
  }, [graph]);

  return (
    <main className={createClassName(styles.root, className)}>
      <section className={styles.canvasContainer} ref={containerRef}>
        <section ref={canvasRef} className={styles.canvas} />
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
        <Overlay />
      </section>
      {kpis}
    </main>
  );
}

function KpiCharts() {
  const [alarms] = useAlarmStore();
  const [latestValuesMap] = useLatestValuesStore();
  const [selectedEntity] = useSelectedStore();

  return useMemo(() => {
    const { entityData } = selectedEntity;

    if (entityData) {
      const { entityId, name, type } = entityData;
      const alarmValue = alarms[entityId];
      const latestValues = latestValuesMap[entityId];

      if (latestValues) {
        const charts = Object.values(latestValues)
          .sort((a, b) => compareStrings(a.metaData.propertyName, b.metaData.propertyName))
          .map((latestValue) => {
            return (
              <KpiChart
                alarmValue={alarmValue}
                className={styles.latestValuesKpi}
                key={`${latestValue.metaData.entityId}-${latestValue.metaData.propertyName}`}
                latestValue={latestValue}
              />
            );
          });

        return (
          <section className={styles.latestValues}>
            <section className={styles.latestValuesHeader}>
              <div className={styles.latestValuesEntityType}>{type}</div>
              <div className={styles.latestValuesEntityName}>{name}</div>
            </section>
            <div className={styles.latestValuesKpis}>{charts}</div>
          </section>
        );
      }
    }

    return null;
  }, [selectedEntity, alarms, latestValuesMap]);
}

function setAlarmState(
  graph: ReturnType<typeof createGraph<EntityData>>,
  alarmState: Record<string, LatestValue<AlarmState>>
) {
  Object.entries(alarmState).forEach(([entityId, state]) => {
    graph.updateNode(entityId, { state: state.dataPoint.y });
  });
}

function isTwinMakerQueryEdgeData(item: any): item is TwinMakerQueryEdgeData {
  return item.relationshipName !== undefined;
}

function isTwinMakerQueryNodeData(item: any): item is TwinMakerQueryNodeData {
  return item.entityId !== undefined;
}
