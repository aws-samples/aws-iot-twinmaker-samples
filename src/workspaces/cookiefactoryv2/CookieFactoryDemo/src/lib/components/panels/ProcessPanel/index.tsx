// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { ExecuteQueryCommand } from '@aws-sdk/client-iottwinmaker';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { COMPONENT_NAMES, QUERY_ALL_EQUIPMENT_AND_PROCESS_STEPS, createQueryByEquipment } from '@/config/project';
import { FitIcon, MinusIcon, PlusIcon, TargetIcon, TrendIcon } from '@/lib/components/svgs/icons';
import { createClassName, type ClassName } from '@/lib/core/utils/element';
import { isNumber, isPlainObject } from '@/lib/core/utils/lang';
import { compareStrings } from '@/lib/core/utils/string';
import { isIgnoredEntity, normalizedEntityData } from '@/lib/init/entities';
import { createGraph, getElementsDefinition, type EdgeData, type NodeData, type NodeRenderData } from '@/lib/graph';
import { alarmStore, useAlarmStore, useLatestValueStore } from '@/lib/stores/data';
import { selectedStore, useSelectedStore, useSummaryStore, summaryStore } from '@/lib/stores/entity';
import { useHopStore } from '@/lib/stores/graph';
import { useClientStore } from '@/lib/stores/iottwinmaker';
import { useHasDashboardStore, usePanelsStore } from '@/lib/stores/panels';
import { useSiteStore } from '@/lib/stores/site';
import type {
  AlarmState,
  LatestValue,
  Primitive,
  TwinMakerQueryData,
  TwinMakerQueryEdgeData,
  TwinMakerQueryNodeData
} from '@/lib/types';

import styles from './styles.module.css';

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
  const [graph, setGraph] = useState<ReturnType<typeof createGraph>>();
  const ref = useRef<HTMLElement>(null);
  const lastKnowledgeGraphQuery = useRef<string | null>(null);

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
      });

      setGraph(graph);

      return () => {
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
      <section className={styles.canvasContainer}>
        <section ref={ref} className={styles.canvas} />
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
  const [alarms] = useAlarmStore();
  const [latestValuesDict] = useLatestValueStore();
  const [selectedEntity] = useSelectedStore();

  return useMemo(() => {
    const { entityData } = selectedEntity;

    if (entityData) {
      const alarmValue = alarms[entityData.entityId];
      const latestValues = latestValuesDict[entityData.entityId];
      const entitySummary = summaryStore.getState()[entityData.entityId];

      if (entitySummary && latestValues) {
        const charts = Object.values(latestValues)
          .sort((a, b) => compareStrings(a.metaData.propertyName, b.metaData.propertyName))
          .map((latestValue) => {
            return (
              <KpiChart
                key={`${latestValue.metaData.entityId}-${latestValue.metaData.propertyName}`}
                alarmValue={alarmValue}
                latestValue={latestValue}
              />
            );
          });

        return (
          <section className={styles.latestValues}>
            <div className={styles.latestValuesEntityName}>{entitySummary.entityName} Components</div>
            <div className={styles.latestValuesKpis}>{charts}</div>
          </section>
        );
      }
    }

    return null;
  }, [selectedEntity, alarms, latestValuesDict]);
}

function KpiChart({
  alarmValue,
  latestValue: {
    dataPoint: { x, y },
    metaData: { propertyName },
    threshold,
    trend,
    unit
  }
}: {
  alarmValue: LatestValue<AlarmState>;
  latestValue: LatestValue<Primitive>;
}) {
  let thresholdBreached = false;
  let thresholdUpperValue: number | undefined;
  let thresholdLowerValue: number | undefined;

  if (isPlainObject(threshold)) {
    const { upper, lower } = threshold;

    if (isNumber(y)) {
      if (upper) {
        thresholdUpperValue = upper;
        thresholdBreached = y > upper;
      }

      if (!thresholdBreached && lower) {
        thresholdLowerValue = lower;
        thresholdBreached = y < lower;
      }
    }
  }

  return (
    <section className={createClassName(styles.latestValue, styles[alarmValue?.dataPoint.y ?? 'Unknown'])}>
      <div className={styles.latestValueName}>{propertyName}</div>
      <div className={styles.latestValueValueGroup}>
        <div className={styles.latestValueValueUnitGroup}>
          <div className={styles.latestValueValue}>{y}</div>
          {unit && <div className={styles.latestValueUnit}>{unit}</div>}
        </div>
        <div className={createClassName(styles.trendGroup, { [styles.thresholdBreached]: thresholdBreached })}>
          {thresholdLowerValue && (
            <ThresholdIndicator
              value={thresholdLowerValue}
              limit="lower"
              isActive={isNumber(y) && y < thresholdLowerValue}
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
              isActive={isNumber(y) && y > thresholdUpperValue}
            />
          )}
        </div>
      </div>
      <div className={styles.latestValueTime}>
        {new Date(x).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'medium' })}
      </div>
    </section>
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
