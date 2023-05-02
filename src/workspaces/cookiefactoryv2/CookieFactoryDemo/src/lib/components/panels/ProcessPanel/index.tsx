// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import { ExecuteQueryCommand } from '@aws-sdk/client-iottwinmaker';
import { useFloating } from '@floating-ui/react';
import { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { COMPONENT_NAMES } from '@/config/iottwinmaker';
import { FitIcon, MinusIcon, PlusIcon, TargetIcon, TrendIcon } from '@/lib/components/svgs/icons';
import { isIgnoredEntity, normalizedEntityData } from '@/lib/entities';
import { createGraph, getElementsDefinition, type EdgeData, type NodeData, type NodeRenderData } from '@/lib/graph';
import { createQueryByEquipment, fullEquipmentAndProcessQuery } from '@/lib/processQueries';
import { TimeSeriesContext } from '@/lib/providers';
import { useAlarmState, useLatestValueState } from '@/lib/state/data';
import {
  selectedState,
  useAlarmHistoryQueryState,
  useDataHistoryQueryState,
  useSelectedState,
  useSummaryState,
  summaryState
} from '@/lib/state/entity';
import { hopState, useHopState } from '@/lib/state/graph';
import { usePanelState } from '@/lib/state/panel';
import { useSiteState } from '@/lib/state/site';
import { useClientState } from '@/lib/state/twinMaker';
import type {
  AlarmState,
  LatestValue,
  Primitive,
  TwinMakerQueryData,
  TwinMakerQueryEdgeData,
  TwinMakerQueryNodeData
} from '@/lib/types';
import { createClassName, type ClassName } from '@/lib/utils/element';
import { isPlainObject } from '@/lib/utils/lang';
import { compareStrings } from '@/lib/utils/string';

import styles from './styles.module.css';
import type { NodeSingular } from 'cytoscape';
import { isNil, isNotNil, nextTick } from '@/lib/utils/lang';

const GRAPH_CANVAS_PADDING = 30;

export function ProcessPanel({ className }: { className?: ClassName }) {
  const [alarmState] = useAlarmState();
  const [latestValueState] = useLatestValueState();
  const [client] = useClientState();
  const [hops] = useHopState();
  const [panels] = usePanelState();
  const [selectedEntity, setSelectedEntity] = useSelectedState();
  const [site] = useSiteState();
  const [summaries] = useSummaryState();
  const [graph, setGraph] = useState<ReturnType<typeof createGraph>>();
  const ref = useRef<HTMLElement>(null);
  const lastKnowledgeGraphQuery = useRef<string | null>(null);
  const shouldFitGraph = useRef(true);
  const [isShowingComponents, setIsShowingComponents] = useState(false);

  const loadData = useCallback(
    async (queryStatement: string) => {
      if (client && site) {
        const command = new ExecuteQueryCommand({
          queryStatement,
          workspaceId: site.awsConfig.workspaceId
        });

        const { rows } = await client.send(command);

        if (rows) {
          const nodeData = new Map<string, NodeData>();
          const edgeData = new Map<string, EdgeData>();

          for await (const { rowData } of rows as TwinMakerQueryData) {
            if (rowData) {
              for await (const item of rowData) {
                if (isTwinMakerQueryNodeData(item)) {
                  const { entityId, entityName, components } = item;

                  if (!isIgnoredEntity(entityId)) {
                    const component = components.find(
                      ({ componentName }) =>
                        componentName === COMPONENT_NAMES.EQUIPMENT || componentName === COMPONENT_NAMES.PROCESS_STEP
                    );

                    if (component) {
                      const { componentName } = component;
                      const entityData = normalizedEntityData.find(({ entityId: id }) => id === entityId) ?? {
                        entityId,
                        componentName,
                        properties: []
                      };

                      nodeData.set(entityId, {
                        entityData,
                        id: entityId,
                        label: entityName,
                        shape: componentName === COMPONENT_NAMES.EQUIPMENT ? 'hexagon' : 'ellipse',
                        state: componentName === COMPONENT_NAMES.EQUIPMENT ? 'Unknown' : 'Normal'
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
            : fullEquipmentAndProcessQuery;

        if (knowledgeGraphQuery !== lastKnowledgeGraphQuery.current) {
          const data = await loadData(knowledgeGraphQuery);

          if (data) {
            graph.setGraphData(getElementsDefinition([...data.nodeData.values()], [...data.edgeData.values()]), {
              fit: shouldFitGraph.current
            });

            graph.center();

            lastKnowledgeGraphQuery.current = knowledgeGraphQuery;
          }
        }

        if (selectedEntityId) {
          graph.selectNode(selectedEntityId);
        }
      }
    },
    [graph, hops]
  );

  const handleCenterClick = useCallback(() => {
    graph?.center();
  }, [graph]);

  const handleFitClick = useCallback(() => {
    graph?.fit(undefined, GRAPH_CANVAS_PADDING);
  }, [graph]);

  const handleZoomInClick = useCallback(() => {
    if (graph) {
      const currentScale = graph.getZoom();
      graph.setZoom(currentScale + 0.1);
    }
  }, [graph]);

  const handleZoomOutClick = useCallback(() => {
    if (graph) {
      const currentScale = graph.getZoom();
      graph.setZoom(currentScale - 0.1);
    }
  }, [graph]);

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
    if (panels.includes('process')) {
      graph?.resize();

      if (shouldFitGraph.current) {
        shouldFitGraph.current = false;
        graph?.fit();
      }

      graph?.center();
    } else {
      shouldFitGraph.current = true;
    }
  }, [graph, panels]);

  useEffect(() => {
    const summaryList = Object.values(summaries);

    if (ref.current && summaryList.length) {
      const rootIds = normalizedEntityData.reduce<string[]>((accum, { entityId, isRoot }) => {
        if (isRoot) {
          accum.push(entityId);
        }
        return accum;
      }, []);

      const graph = createGraph(ref.current, {
        canvasPadding: GRAPH_CANVAS_PADDING,
        fitOnLoad: true,
        rootElementIds: rootIds
      });

      graph.subscribe(({ eventName, data }) => {
        switch (eventName) {
          case 'click': {
            if (data?.entityData) {
              const { entityData } = data as NodeRenderData;
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
            const { entityData } = selectedState.getState();

            if (entityData) {
              const { entityId } = entityData;

              if (!graph.nodesInView(entityId)) {
                graph.center(entityId);
              }
            }
            break;
          }
        }
      });

      setGraph(graph);

      return () => {
        graph.dispose();
      };
    }
  }, [summaries]);

  useEffect(() => {
    executeQuery();
  }, [graph]);

  useEffect(() => {
    if (graph) {
      setAlarmState(graph, alarmState);
    }
  }, [alarmState, graph]);

  const latestValue = useMemo(() => {
    if (!panels.includes('dashboard')) {
      const { entityData } = selectedEntity;

      if (entityData) {
        const alarm = alarmState[entityData.entityId];
        const latestValue = latestValueState[entityData.entityId];

        if (latestValue) {
          const kpis = Object.values(latestValue)
            .sort((a, b) => compareStrings(a.metaData.propertyName, b.metaData.propertyName))
            .map(({ dataPoint: { x, y }, metaData: { entityId, propertyName }, threshold, trend, unit }) => {
              let thresholdBreached = false;
              let thresholdUpperValue: number | undefined;
              let thresholdLowerValue: number | undefined;

              if (isPlainObject(threshold)) {
                const { upper, lower } = threshold;

                if (upper) {
                  thresholdUpperValue = upper;
                  thresholdBreached = y > upper;
                }

                if (!thresholdBreached && lower) {
                  thresholdLowerValue = lower;
                  thresholdBreached = y < lower;
                }
              }

              return (
                <section
                  className={createClassName(styles.latestValue, styles[alarm?.dataPoint.y ?? 'Unknown'])}
                  key={`${entityId}-${propertyName}`}
                >
                  <div className={styles.latestValueName}>{propertyName}</div>
                  <div className={styles.latestValueValueGroup}>
                    <div className={styles.latestValueValueUnitGroup}>
                      <div className={styles.latestValueValue}>{y}</div>
                      {unit && <div className={styles.latestValueUnit}>{unit}</div>}
                    </div>
                    <div
                      className={createClassName(styles.trendGroup, { [styles.thresholdBreached]: thresholdBreached })}
                    >
                      {thresholdLowerValue && (
                        <ThresholdIndicator
                          value={thresholdLowerValue}
                          limit="lower"
                          isActive={y < thresholdLowerValue}
                        />
                      )}
                      <TrendIcon
                        className={createClassName(styles.trendIcon, {
                          [styles.trendIconDown]: trend === -1,
                          [styles.trendIconUp]: trend === 1
                        })}
                      />
                      {thresholdUpperValue && (
                        <ThresholdIndicator
                          value={thresholdUpperValue}
                          limit="upper"
                          isActive={y > thresholdUpperValue}
                        />
                      )}
                    </div>
                  </div>
                  <div className={styles.latestValueTime}>
                    {new Date(x).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'medium' })}
                  </div>
                </section>
              );
            });

          const entitySummary = summaryState.getState()[entityData.entityId];

          return (
            <section className={styles.latestValues}>
              {entitySummary && (
                <div className={styles.latestValuesEntityName}>{entitySummary.entityName} Components</div>
              )}
              <div className={styles.latestValuesKpis}>{kpis}</div>
            </section>
          );
        }
      }
    }

    return null;
  }, [graph, selectedEntity, alarmState, latestValueState, panels]);

  // useEffect(() => {
  //   if (graph && isShowingComponents && selectedEntity.entityData) {
  //     const { entityId } = selectedEntity.entityData;

  //     if (!graph.nodesInView(entityId)) {
  //       graph.center(entityId);
  //     }
  //   }
  // }, [graph, isShowingComponents, selectedEntity]);

  // useEffect(() => {
  //   setIsShowingComponents((state) => {
  //     const nextState = isNotNil(latestValue);
  //     if (state !== nextState) return nextState;
  //     return state;
  //   });
  // }, [latestValue]);

  return (
    <main className={createClassName(styles.root, className)}>
      <section className={styles.canvasContainer}>
        <section ref={ref} className={styles.canvas} />
        <section className={styles.controls}>
          <button className={styles.button} onPointerDown={handleFitClick}>
            <FitIcon className={styles.buttonFitIcon} />
          </button>
          <button className={styles.button} onPointerDown={handleCenterClick}>
            <TargetIcon className={styles.buttonCenterIcon} />
          </button>
          <button className={styles.button} onPointerDown={handleZoomInClick}>
            <PlusIcon className={styles.buttonZoomInIcon} />
          </button>
          <button className={styles.button} onPointerDown={handleZoomOutClick}>
            <MinusIcon className={styles.buttonZoomOutIcon} />
          </button>
        </section>
      </section>
      {latestValue}
    </main>
  );
}

function ThresholdIndicator({
  value,
  limit,
  isActive
}: {
  value: number;
  limit: 'upper' | 'lower';
  isActive: boolean;
}) {
  return (
    <main
      className={createClassName(styles.thresholdIndicator, {
        [styles.thresholdIndicatorLimitUpper]: limit === 'upper',
        [styles.thresholdIndicatorLimitLower]: limit === 'lower',
        [styles.isActive]: isActive
      })}
    >
      {value}
    </main>
  );
}

function setAlarmState(graph: ReturnType<typeof createGraph>, alarmState: Record<string, LatestValue<AlarmState>>) {
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
