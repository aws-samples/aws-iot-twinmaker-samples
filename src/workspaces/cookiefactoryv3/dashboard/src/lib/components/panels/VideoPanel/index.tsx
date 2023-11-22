// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { useStore } from '@nanostores/react';
import { type ReactNode } from 'react';

import { Panel, type PanelProps } from '@iot-prototype-kit/components/Panel';
import { VideoPlayer } from '@iot-prototype-kit/components/VideoPlayer';
import { DropDownMenu } from '@iot-prototype-kit/core/components/DropDownMenu';
import { ArrowHeadDownIcon } from '@iot-prototype-kit/components/svgs/icons/ArrowHeadDownIcon';
import { createClassName } from '@iot-prototype-kit/core/utils/element';
import { isEmpty } from '@iot-prototype-kit/core/utils/lang2';
import { $entitiesWithVideo, $selectedEntity } from '@iot-prototype-kit/stores/entity';
import { isEntityWithVideo } from '@iot-prototype-kit/utils/entity';

import styles from './styles.module.css';

type VideoPanelProps = PanelProps<{ selectorDefaultLabel: string }>;

export function VideoPanel({ className, selectorDefaultLabel, ...props }: VideoPanelProps) {
  const { entity } = useStore($selectedEntity);

  return (
    <Panel className={createClassName(styles.root, className)} {...props} isExpandable={false} layer="br">
      {entity && isEntityWithVideo(entity) ? (
        <section data-video>
          <FeedSelector defaultLabel={selectorDefaultLabel} panelId={props.id} />
          <VideoPlayer
            componentName={entity.video.componentName}
            entityId={entity.entityId}
            key={entity.entityId}
            viewport={entity.video.initialViewport}
            data-player
          />
        </section>
      ) : (
        <section data-empty>
          <FeedSelector defaultLabel={selectorDefaultLabel} panelId={props.id} />
        </section>
      )}
    </Panel>
  );
}

function FeedSelector({ defaultLabel, panelId }: { defaultLabel: string; panelId: string }) {
  const entitiesWithVideo = useStore($entitiesWithVideo);
  const { entity } = useStore($selectedEntity);

  if (entitiesWithVideo.length == 0) return null;

  const selectedLabel = entity?.video ? entity.metadata.displayName : defaultLabel;

  const sortedEntities = entitiesWithVideo.sort((a, b) => {
    if (a.metadata.displayName === b.metadata.displayName) return 0;
    return a.metadata.displayName < b.metadata.displayName ? -1 : 1;
  });

  const items: Record<string, ReactNode> = {
    '-': <MenuItem label={defaultLabel} selected={isEmpty(entity?.video)} />
  };

  sortedEntities.forEach(({ entityId, metadata: { displayName } }) => {
    items[entityId] = <MenuItem label={displayName} selected={entityId === entity?.entityId} />;
  });

  return (
    <DropDownMenu
      className={styles.feedSelector}
      items={items}
      onSelect={(key) => {
        const entity = entitiesWithVideo.find(({ entityId }) => entityId === key) ?? null;
        $selectedEntity.set({ entity, originId: panelId });
      }}
      selectedKey={entity?.entityId ?? '-'}
    >
      <main data-trigger>
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
