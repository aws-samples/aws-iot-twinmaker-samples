// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import {
  SceneViewer,
  useSceneComposerApi,
  type SelectionChangedEventCallback,
  type WidgetClickEventCallback
} from '@iot-app-kit/scene-composer';
import { useCallback, useEffect } from 'react';

import { VIEWPORT } from '@/config/project';
import { createClassName, type ClassName } from '@/lib/core/utils/element';
import { isNil } from '@/lib/core/utils/lang';
import { normalizedEntityData } from '@/lib/init/entities';
import { useDataStreamsStore } from '@/lib/stores/data';
import { useSelectedStore } from '@/lib/stores/entity';
import { useSceneLoaderStore } from '@/lib/stores/iottwinmaker';
import type { DataBindingContext, EntityData } from '@/lib/types';

import styles from './styles.module.css';

const sceneComposerId = crypto.randomUUID();

export const ScenePanel = ({ className }: { className?: ClassName }) => {
  const { findSceneNodeRefBy, setSelectedSceneNodeRef, setCameraTarget } = useSceneComposerApi(sceneComposerId);
  const [dataStreams] = useDataStreamsStore();
  const [sceneLoader] = useSceneLoaderStore();
  const [selectedEntity, setSelectedEntity] = useSelectedStore();

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

  return (
    <main className={createClassName(styles.root, className)}>
      <section className={styles.container}>
        {sceneLoader && (
          <SceneViewer
            config={{
              dracoDecoder: {
                enable: true,
                path: 'https://www.gstatic.com/draco/versioned/decoders/1.5.3/' // path to the draco files
              }
            }}
            dataStreams={dataStreams}
            onSelectionChanged={handleSelectionChange}
            onWidgetClick={handleWidgetClick}
            // queries={timeSeriesQueries}
            sceneComposerId={sceneComposerId}
            sceneLoader={sceneLoader}
            selectedDataBinding={selectedEntity.entityData ?? undefined}
            viewport={VIEWPORT}
          />
        )}
      </section>
    </main>
  );
};
