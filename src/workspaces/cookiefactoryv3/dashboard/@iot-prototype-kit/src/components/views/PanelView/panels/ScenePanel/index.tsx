// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import {
  KnownComponentType,
  SceneComposerInternal,
  useSceneComposerApi,
  type ITagData,
  type SelectionChangedEventCallback
} from '@iot-app-kit/scene-composer';
import { useCallback, useEffect, useRef, type ReactNode } from 'react';

import { Panel, type PanelProps } from '@iot-prototype-kit/components/Panel';
import { ArrowHeadDownIcon } from '@iot-prototype-kit/components/svgs/icons/ArrowHeadDownIcon';
import { CameraIcon, CameraFilledIcon } from '@iot-prototype-kit/components/svgs/icons/CameraIcons';
import { DropDownMenu } from '@iot-prototype-kit/core/components/DropDownMenu';
import { useStore } from '@iot-prototype-kit/core/store';
import { createClassName } from '@iot-prototype-kit/core/utils/element';
import { isEmpty } from '@iot-prototype-kit/core/utils/lang2';
import { $dataStreams } from '@iot-prototype-kit/stores/data';
import { $entityList, $selectedEntity } from '@iot-prototype-kit/stores/entity';
import { $activeCamera, $sceneLoader, $sceneMetadataModule } from '@iot-prototype-kit/stores/iottwinmaker';
import type { Entity } from '@iot-prototype-kit/types';
import { getAppKitConfig, getTwinMakerConfig } from '@iot-prototype-kit/utils/config';
import { isEntityWithComponent } from '@iot-prototype-kit/utils/entity';

import styles from './styles.module.css';

type AdditionalComponentData = ITagData & {
  dataBindingContext?: { entityId: string };
  dataBindingContexts?: { entityId: string }[];
  navLink?: { destination?: 'video'; params?: Record<'kvsStreamName', any> };
};

type ScenePanelProps = PanelProps;

export function ScenePanel({ className, ...props }: ScenePanelProps) {
  const activeCamera = useStore($activeCamera);
  const dataStreams = useStore($dataStreams);
  const sceneLoader = useStore($sceneLoader);
  const sceneMetadataModule = useStore($sceneMetadataModule);
  const selectedEntity = useStore($selectedEntity);
  const twinMakerConfig = getTwinMakerConfig();
  const appKitConfig = getAppKitConfig();
  const sceneComposerId = twinMakerConfig?.sceneId ?? crypto.randomUUID();
  const { findSceneNodeRefBy, setCameraTarget, setSelectedSceneNodeRef } = useSceneComposerApi(sceneComposerId);
  const selectedDataBindingRef = useRef<string | 0 | undefined>();

  const selectEntity = useCallback(
    (entity: Entity | null, refOnly = false) => {
      selectedDataBindingRef.current = entity?.entityId;
      if (!refOnly) $selectedEntity.set({ entity, originId: props.id });
    },
    [props.id]
  );

  const handleSelectionChange: SelectionChangedEventCallback = useCallback(({ additionalComponentData }) => {
    const entity = $selectedEntity.get().entity;

    if (isEmpty(additionalComponentData)) {
      // Handle deselection event
      selectEntity(null, selectedDataBindingRef.current === 0 && !isEmpty(entity));
    } else {
      const { dataBindingContext } = additionalComponentData[0] as AdditionalComponentData;

      // Handle selection event
      if (selectedDataBindingRef.current === 0) {
        // Handle external event
        selectEntity(entity, true);
      } else {
        // Handle internal event
        const entity = $entityList.get().find(({ entityId }) => entityId === dataBindingContext?.entityId) ?? null;
        selectEntity(entity);
      }
    }
  }, []);

  useEffect(() => {
    if (selectedEntity.originId !== props.id) {
      if (selectedEntity.entity) {
        selectedDataBindingRef.current = 0;

        if (isEntityWithComponent(selectedEntity.entity)) {
          const {
            component: { componentName },
            entityId
          } = selectedEntity.entity;
          const nodeRef = findSceneNodeRefBy({ entityId, componentName }, [KnownComponentType.Tag])[0];

          if (nodeRef) {
            setSelectedSceneNodeRef(nodeRef);
            setCameraTarget(nodeRef, appKitConfig?.sceneViewer?.cameraControlMode ?? 'teleport');

            return;
          }
        }
      }

      setSelectedSceneNodeRef();
    }
  }, [props.id, selectedEntity, findSceneNodeRefBy, setCameraTarget, setSelectedSceneNodeRef]);

  return (
    <Panel
      className={createClassName(styles.root, className)}
      {...props}
      controls={<CameraSelector />}
      collapseControlBar={true}
    >
      <section className={styles.container}>
        {sceneLoader && (
          <SceneComposerInternal
            activeCamera={activeCamera?.id ?? undefined}
            config={{
              ...(appKitConfig?.sceneViewer?.config ?? {}),
              mode: 'Viewing'
            }}
            dataStreams={dataStreams}
            externalLibraryConfig={appKitConfig?.sceneViewer?.externalLibraryConfig}
            onSelectionChanged={handleSelectionChange}
            sceneComposerId={sceneComposerId}
            sceneLoader={sceneLoader}
            sceneMetadataModule={sceneMetadataModule ?? undefined}
            viewport={appKitConfig?.timeSeriesData?.viewport}
          />
        )}
      </section>
    </Panel>
  );
}

function CameraSelector() {
  const activeCamera = useStore($activeCamera);
  const cameraConfigs = getTwinMakerConfig()?.cameras;

  if (isEmpty(cameraConfigs)) return null;

  const placeholder = cameraConfigs.find(({ isPlaceholder }) => isPlaceholder === true);
  const selectedLabel = activeCamera?.displayName ?? placeholder?.displayName;

  const sortedCameras = cameraConfigs
    ?.filter(({ isPlaceholder }) => isEmpty(isPlaceholder))
    .sort((a, b) => {
      if (a === b) return 0;
      return a < b ? -1 : 1;
    });

  const items: Record<string, ReactNode> = {};

  if (placeholder) {
    items[placeholder.id] = (
      <MenuItem
        label={
          <>
            <CameraIcon data-menu-item-icon />
            <span data-placeholder-label>{placeholder.menuDisplayName ?? placeholder.displayName}</span>
          </>
        }
        selected={isEmpty(activeCamera)}
      />
    );
  }

  sortedCameras.forEach((camera) => {
    items[camera.id] = (
      <MenuItem
        label={
          <>
            <CameraFilledIcon data-menu-item-icon />
            <span>{camera.menuDisplayName ?? camera.displayName}</span>
          </>
        }
        selected={camera === activeCamera}
      />
    );
  });

  return (
    <DropDownMenu
      className={styles.cameraSelector}
      items={items}
      onSelect={(key) => {
        const cameraConfig = cameraConfigs.find(({ id, isPlaceholder }) => id === key && !isPlaceholder) ?? null;
        $activeCamera.set(cameraConfig);
      }}
      selectedKey={activeCamera?.id ?? placeholder?.id}
    >
      <main data-trigger>
        {activeCamera ? <CameraFilledIcon data-trigger-icon /> : <CameraIcon data-trigger-icon />}
        {selectedLabel}
        <ArrowHeadDownIcon data-trigger-arrow />
      </main>
    </DropDownMenu>
  );
}

function MenuItem({ label, selected }: { label: ReactNode; selected?: boolean }) {
  return (
    <main data-menu-item data-selected={selected === true}>
      {label}
    </main>
  );
}
