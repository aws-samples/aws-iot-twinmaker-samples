// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  SceneComposerInternal,
  useSceneComposerApi,
  type ITagData,
  type SelectionChangedEventCallback
} from '@iot-app-kit/scene-composer';

import { useStore } from '@iot-prototype-kit/core/store';
import { isEmpty } from '@iot-prototype-kit/core/utils/lang2';
import { $entities, $selectedEntity, setSelectedEntity } from '@iot-prototype-kit/stores/entity';
import { $activeCamera, $sceneLoader, $sceneMetadataModule } from '@iot-prototype-kit/stores/iottwinmaker';
import type { AwsConfig, Entity } from '@iot-prototype-kit/types';
import { isEntityWithComponent } from '@iot-prototype-kit/utils/entity';

export type AdditionalComponentData = ITagData & {
  dataBindingContext?: { entityId: string };
  dataBindingContexts?: { entityId: string }[];
  navLink?: { destination?: 'video'; params?: Record<'kvsStreamName', any> };
};

export function useSceneViewer(
  originId: string,
  options?: {
    appKitConfig?: AwsConfig.Iot.AppKit;
    twinMakerConfig?: AwsConfig.Iot.TwinMaker;
  }
) {
  const activeCamera = useStore($activeCamera);
  const sceneLoader = useStore($sceneLoader);
  const sceneMetadataModule = useStore($sceneMetadataModule);
  const selectedEntity = useStore($selectedEntity);
  const sceneComposerId = options?.twinMakerConfig?.sceneId ?? crypto.randomUUID();
  const { findSceneNodeRefBy, highlights, setCameraTarget, setSelectedSceneNodeRef } = useSceneComposerApi(sceneComposerId);
  const [isLoaded, setIsLoaded] = useState(false);
  const selectedDataBindingRef = useRef<string | 0 | undefined>();



  const moveCamera = useCallback(
    (nodeRef: string) => {
      setCameraTarget(nodeRef, options?.appKitConfig?.sceneViewer?.cameraControlMode ?? 'teleport');
    },
    [options?.appKitConfig, setCameraTarget]
  );

  const handleSceneLoaded = useCallback(() => setIsLoaded(true), []);

  const handleSelectionChange: SelectionChangedEventCallback = useCallback(
    ({ additionalComponentData, nodeRef }) => {
      const entity = $selectedEntity.get().entity;

      function updateSelectedEntity(entity: Entity | null, setRefOnly = false) {
        selectedDataBindingRef.current = entity?.entityId;
        if (!setRefOnly) setSelectedEntity(entity, originId);
      }

      if (isEmpty(additionalComponentData)) {
        // Handle deselection event
        updateSelectedEntity(null, selectedDataBindingRef.current === 0 && !isEmpty(entity));
      } else {
        const { dataBindingContext } = additionalComponentData[0] as AdditionalComponentData;

        // Handle selection event
        if (selectedDataBindingRef.current === 0) {
          // Handle external event
          updateSelectedEntity(entity, true);
        } else {
          // Handle internal event
          const entity = $entities.get()[dataBindingContext?.entityId ?? ''] ?? null;
          updateSelectedEntity(entity);
          if (entity && nodeRef) moveCamera(nodeRef);
        }
      }
    },
    [originId, moveCamera]
  );

  const sceneViewer = useMemo(() => {
    if (!sceneLoader) return null;

    return (
      <SceneComposerInternal
        activeCamera={activeCamera?.id ?? undefined}
        config={{
          ...(options?.appKitConfig?.sceneViewer?.config ?? {}),
          mode: 'Viewing'
        }}
        externalLibraryConfig={options?.appKitConfig?.sceneViewer?.externalLibraryConfig}
        onSceneLoaded={handleSceneLoaded}
        onSelectionChanged={handleSelectionChange}
        sceneComposerId={sceneComposerId}
        sceneLoader={sceneLoader}
        sceneMetadataModule={sceneMetadataModule ?? undefined}
        viewport={options?.appKitConfig?.timeSeriesData?.viewport}
      />
    );
  }, [activeCamera, options?.appKitConfig, sceneComposerId, sceneLoader, sceneMetadataModule]);

  useEffect(() => {
    if (selectedEntity.originId !== originId) {
      if (selectedEntity.entity) {
        selectedDataBindingRef.current = 0;

        if (isEntityWithComponent(selectedEntity.entity)) {
          const {
            component: { componentName },
            entityId
          } = selectedEntity.entity;

          const nodeRef = findSceneNodeRefBy({ entityId, componentName })[0];

          if (nodeRef) {
            setSelectedSceneNodeRef(nodeRef);
            moveCamera(nodeRef);
            return;
          }
        }
      }

      setSelectedSceneNodeRef();
    }
  }, [originId, selectedEntity, findSceneNodeRefBy, moveCamera, setSelectedSceneNodeRef]);

  return { isLoaded, sceneViewer };
}
