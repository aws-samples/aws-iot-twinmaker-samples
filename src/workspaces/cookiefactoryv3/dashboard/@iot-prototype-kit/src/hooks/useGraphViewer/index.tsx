// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { ExecuteQueryCommand } from '@aws-sdk/client-iottwinmaker';
import { useCallback, useEffect, useRef } from 'react';

import { FitIcon } from '@iot-prototype-kit/components/svgs/icons/FitIcon';
import { MinusIcon } from '@iot-prototype-kit/components/svgs/icons/MinusIcon';
import { PlusIcon } from '@iot-prototype-kit/components/svgs/icons/PlusIcon';
import { TargetIcon } from '@iot-prototype-kit/components/svgs/icons/TargetIcon';
import { createGraph, getElementsDefinition } from '@iot-prototype-kit/core/graph';
import { $event } from '@iot-prototype-kit/core/graph/events';
import type { EdgeData, EventName, NodeData } from '@iot-prototype-kit/core/graph/types';
import { useStore } from '@iot-prototype-kit/core/store';
import { isNil } from '@iot-prototype-kit/core/utils/lang2';

import { $alarmValues } from '@iot-prototype-kit/stores/data';
import { $entityList, $selectedEntity, setSelectedEntity } from '@iot-prototype-kit/stores/entity';
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

import styles from './styles.module.scss';

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

export function useGraphViewer(originId: string) {
  const alarmValues = useStore($alarmValues);
  const client = useStore($client);
  const entityList = useStore($entityList);
  const flexPanels = useStore($openFlexPanels);
  const selectedEntity = useStore($selectedEntity);
  const site = useStore($site);
  const graphRef = useRef<ReturnType<typeof createGraph<Entity>> | null>(null);
  const lastKnowledgeGraphQuery = useRef<string | null>(null);
  const panelCount = useRef<number>(flexPanels.length);
  const unsubscribeEventStoreRef = useRef<(() => void) | null>(null);

  const canvasRef = useCallback(
    (el: HTMLElement | null) => {
      if (!el || entityList.length === 0) {
        if (unsubscribeEventStoreRef.current) {
          unsubscribeEventStoreRef.current();
          unsubscribeEventStoreRef.current = null;
        }
        graphRef.current?.dispose();
        graphRef.current = null;
        lastKnowledgeGraphQuery.current = null;
        return;
      }

      const rootIds = entityList.reduce<string[]>((accum, { entityId, isRoot }) => {
        if (isRoot) {
          accum.push(entityId);
        }
        return accum;
      }, []);

      const graph = createGraph<Entity>(el, {
        canvasPadding: GRAPH_CANVAS_PADDING,
        eventNames: EVENT_NAMES,
        fitOnLoad: true,
        rootElementIds: rootIds
      });

      graphRef.current = graph;

      graphRef.current.setZoom(graphRef.current.getZoom() + 0.1);

      if (unsubscribeEventStoreRef.current) {
        unsubscribeEventStoreRef.current();
      }

      unsubscribeEventStoreRef.current = $event.listen((event) => {
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
                  setSelectedEntity(entityData, originId);
                }
              } else {
                graphRef.current.deselectNode();
                queryByEntity();
                setSelectedEntity(null, originId);
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

      const { entity } = $selectedEntity.get();
      queryByEntity(entity?.entityId);
    },
    [entityList, originId]
  );

  const executeQuery = useCallback(
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

                  const relationshipConfigs = getTwinMakerConfig()?.relationshipConfigs ?? [];

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

  const queryByEntity = useCallback(
    async (entityId?: string) => {
      if (graphRef.current) {
        const knowledgeGraphQuery = QUERY_ALL_EQUIPMENT_AND_PROCESS_STEPS;

        if (knowledgeGraphQuery !== lastKnowledgeGraphQuery.current) {
          const data = await executeQuery(knowledgeGraphQuery);

          if (data) {
            graphRef.current.setGraphData(
              getElementsDefinition([...data.nodeData.values()], [...data.edgeData.values()]),
              {
                // fit: true
              }
            );

            lastKnowledgeGraphQuery.current = knowledgeGraphQuery;
          }
        }

        setAlarmValue(graphRef.current, $alarmValues.get());

        if (entityId) {
          graphRef.current.selectNode(entityId);

          // if (!graphRef.current.nodesInView(entityId)) {
          //   graphRef.current.center(entityId);
          // }
        }
      }
    },
    [executeQuery]
  );

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

  // useEffect(() => {
  //   return () => {

  //   };
  // }, [originId]);

  useEffect(() => {
    if (graphRef.current) {
      setAlarmValue(graphRef.current, alarmValues);
    }
  }, [alarmValues]);

  // Update graph if `selectedEntity` set by an external component
  useEffect(() => {
    if (graphRef.current && selectedEntity.originId !== originId) {
      if (selectedEntity.entity) {
        queryByEntity(selectedEntity.entity.entityId);
      } else {
        graphRef.current.deselectNode();
        queryByEntity();
      }
    }
  }, [originId, selectedEntity]);

  // Create graph on load
  // useEffect(() => {
  //   const { entity } = $selectedEntity.get();
  //   queryByEntity(entity?.entityId);
  // }, []);

  return {
    graphViewer: (
      <section className={styles.root}>
        <section ref={canvasRef} data-canvas />
        {/* <section className={styles.overlay}></section> */}
        <section data-controls>
          <button data-button onPointerUp={handleFit}>
            <FitIcon data-button-icon data-fit />
          </button>
          <button data-button onPointerUp={handleCenter}>
            <TargetIcon data-button-icon data-center />
          </button>
          <button data-button onPointerUp={handleZoomIn}>
            <PlusIcon data-button-icon data-zoom-in />
          </button>
          <button data-button onPointerUp={handleZoomOut}>
            <MinusIcon data-button-icon data-zoom-out />
          </button>
        </section>
      </section>
    )
  };
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
