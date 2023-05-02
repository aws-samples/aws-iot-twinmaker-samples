// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import {
  SceneViewer,
  useSceneComposerApi,
  type SelectionChangedEventCallback,
  type WidgetClickEventCallback
} from '@iot-app-kit/scene-composer';
import { useCallback, useEffect } from 'react';

import { VIEWPORT } from '@/config/iottwinmaker';
import { normalizedEntityData } from '@/lib/entities';
import { useTimeSeriesQuery } from '@/lib/hooks';
import { useSelectedState, useAlarmHistoryQueryState } from '@/lib/state/entity';
import { useSceneLoaderState } from '@/lib/state/twinMaker';
import type { DataBindingContext, EntityData } from '@/lib/types';
import { createClassName, type ClassName } from '@/lib/utils/element';
import { isNil } from '@/lib/utils/lang';

import styles from './styles.module.css';

const sceneComposerId = crypto.randomUUID();

export const ScenePanel = ({ className }: { className?: ClassName }) => {
  const { findSceneNodeRefBy, setSelectedSceneNodeRef, setCameraTarget } = useSceneComposerApi(sceneComposerId);
  const [alarmHistoryQuery] = useAlarmHistoryQueryState();
  const [timeSeriesQuery, setTimeSeriesQuery] = useTimeSeriesQuery(alarmHistoryQuery);
  const [selectedEntity, setSelectedEntity] = useSelectedState();
  const [sceneLoader] = useSceneLoaderState();

  const handleSelectionChange: SelectionChangedEventCallback = useCallback(
    ({ componentTypes, additionalComponentData }) => {
      const { type } = selectedEntity;

      if (
        type === 'scene' &&
        componentTypes.length &&
        componentTypes.every((item) => item !== 'Tag') &&
        (isNil(additionalComponentData) || additionalComponentData.length === 0)
      ) {
        setSelectedEntity({ entityData: null, type: 'scene' });
      }
    },
    [selectedEntity]
  );

  const handleWidgetClick: WidgetClickEventCallback = useCallback(({ additionalComponentData }) => {
    let entityData: EntityData | null = null;

    if (additionalComponentData && additionalComponentData.length) {
      const { dataBindingContext } = additionalComponentData[0];

      if (dataBindingContext) {
        const { entityId } = dataBindingContext as DataBindingContext;
        entityData = normalizedEntityData.find((entity) => entity.entityId === entityId) ?? null;
      }
    }

    setSelectedEntity({ entityData, type: 'scene' });
  }, []);

  useEffect(() => {
    const { entityData, type } = selectedEntity;

    if (entityData && type !== 'scene') {
      const { entityId, componentName } = entityData;
      const nodeRefs = findSceneNodeRefBy({ entityId, componentName });

      if (nodeRefs && nodeRefs.length > 0) {
        setCameraTarget(nodeRefs[nodeRefs.length - 1], 'transition');
        setSelectedSceneNodeRef(nodeRefs[nodeRefs.length - 1]);
      }
    }

    if (isNil(entityData) && type !== 'scene') {
      setSelectedSceneNodeRef(undefined);
    }
  }, [selectedEntity]);

  useEffect(() => {
    setTimeSeriesQuery(alarmHistoryQuery);
  }, [alarmHistoryQuery]);

  return (
    <main className={createClassName(styles.root, className)}>
      {sceneLoader && (
        <SceneViewer
          sceneComposerId={sceneComposerId}
          config={{
            dracoDecoder: {
              enable: true,
              path: 'https://www.gstatic.com/draco/versioned/decoders/1.5.3/' // path to the draco files
            }
          }}
          queries={timeSeriesQuery}
          selectedDataBinding={selectedEntity.entityData ?? undefined}
          sceneLoader={sceneLoader}
          onSelectionChanged={handleSelectionChange}
          onWidgetClick={handleWidgetClick}
          viewport={VIEWPORT}
        />
      )}
    </main>
  );
};
