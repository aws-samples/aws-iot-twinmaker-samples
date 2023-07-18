// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import {
  SceneViewer,
  useSceneComposerApi,
  type SelectionChangedEventCallback,
  type WidgetClickEventCallback
} from '@iot-app-kit/scene-composer';
import { useCallback, useEffect, useRef } from 'react';

import { VIEWPORT } from '@/config/project';
import { createClassName, type ClassName } from '@/lib/core/utils/element';
import { normalizedEntityData } from '@/lib/init/entities';
import { useDataStreamsStore } from '@/lib/stores/data';
import { selectedStore, useSelectedStore } from '@/lib/stores/entity';
import { useSceneLoaderStore } from '@/lib/stores/iottwinmaker';
import type { DataBindingContext, EntityData } from '@/lib/types';

import styles from './styles.module.css';

const sceneComposerId = crypto.randomUUID();

export const ScenePanel = ({ className }: { className?: ClassName }) => {
  const { findSceneNodeRefBy, setSelectedSceneNodeRef, setCameraTarget } = useSceneComposerApi(sceneComposerId);
  const [dataStreams] = useDataStreamsStore();
  const [sceneLoader] = useSceneLoaderStore();
  const [selectedEntity, setSelectedEntity] = useSelectedStore();
  const selectedDataBindingRef = useRef<string | undefined>(selectedEntity.entityData?.entityId);

  /**
   * Handles a deselection event, setting a null entity if originating in ScenViewer. To determine if the event
   * originated in SceneViewer, the ComponentData on the event payload is evalutated. If there is ComponentData, it sets
   * a reference to that selected entity id. If there is no ComponentData and `selectedEntity` is defined, it compares
   * the current reference id to selected entity. If they are the same, that means the event originated within
   * SceneViewer.
   */
  const handleSelectionChange: SelectionChangedEventCallback = useCallback(({ additionalComponentData }) => {
    if (additionalComponentData === undefined || additionalComponentData.length == 0) {
      const { entityData } = selectedStore.getState();

      if (
        entityData &&
        (entityData.entityId === selectedDataBindingRef.current || selectedDataBindingRef.current === undefined)
      ) {
        setSelectedEntity({ entityData: null, type: 'scene' });
      }

      selectedDataBindingRef.current = undefined;
    } else {
      const { dataBindingContext } = additionalComponentData[0];
      const { entityId } = dataBindingContext as DataBindingContext;
      selectedDataBindingRef.current = entityId;
    }
  }, []);

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
    const { entityData } = selectedEntity;

    if (entityData) {
      const { entityId, componentName } = entityData;
      const nodeRefs = findSceneNodeRefBy({ entityId, componentName });

      if (nodeRefs && nodeRefs.length > 0) {
        setCameraTarget(nodeRefs[nodeRefs.length - 1], 'transition');
        setSelectedSceneNodeRef(nodeRefs[nodeRefs.length - 1]);
      }
    } else {
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
