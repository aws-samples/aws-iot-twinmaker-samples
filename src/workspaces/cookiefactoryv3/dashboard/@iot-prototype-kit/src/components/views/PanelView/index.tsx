// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { type PointerEvent, useEffect, useMemo, type CSSProperties, type ReactNode } from 'react';

import { DropDownMenu } from '@iot-prototype-kit/core/components/DropDownMenu';
import { ArrowHeadDownIcon } from '@iot-prototype-kit/components/svgs/icons/ArrowHeadDownIcon';
import { CloseAllIcon } from '@iot-prototype-kit/components/svgs/icons/CloseAllIcon';
import { GlobeIcon } from '@iot-prototype-kit/components/svgs/icons/GlobeIcon';
import { SensorIcon } from '@iot-prototype-kit/components/svgs/icons/SensorIcon';
import { useStore } from '@iot-prototype-kit/core/store';
import { createClassName, type ComponentProps } from '@iot-prototype-kit/core/utils/element';
import { isEmpty, isFunction } from '@iot-prototype-kit/core/utils/lang2';
import { $entities, $entityList, $selectedEntity } from '@iot-prototype-kit/stores/entity';
import {
  $openFlexPanels,
  $openLayerPanels,
  $openPanels,
  resetOpenPanels,
  setPanelConfigs,
  togglePanel
} from '@iot-prototype-kit/stores/panel';
import { $site } from '@iot-prototype-kit/stores/site';
import type { Entity, PanelConfig } from '@iot-prototype-kit/types';

import styles from './styles.module.css';

export function PanelView({
  autoOpenPanels,
  children,
  className,
  configs,
  selectedPanelIds,
  ...props
}: ComponentProps<{
  autoOpenPanels?: ((entity: Entity) => string | null)[];
  configs: PanelConfig[];
  selectedPanelIds?: string[];
}>) {
  const openFlexPanels = useStore($openFlexPanels);
  const openLayerPanels = useStore($openLayerPanels);
  const openPanels = useStore($openPanels);
  const selectedEntity = useStore($selectedEntity);

  useEffect(() => setPanelConfigs(configs), [configs]);

  const panels = useMemo(() => {
    if (isEmpty(openPanels)) return children;

    const layouts = openFlexPanels.reduce<ReactNode[]>((accum, id) => {
      const config = configs.find((config) => config.id === id);
      if (config) {
        const element = isFunction(config.element) ? config.element(config) : config.element;
        accum.push(element);
      }
      return accum;
    }, []);

    const layers = openLayerPanels.reduce<ReactNode[]>((accum, id) => {
      const config = configs.find((config) => config.id === id);
      if (config) {
        const element = isFunction(config.element) ? config.element(config) : config.element;
        accum.push(element);
      }
      return accum;
    }, []);

    const style = { '--column-width': `${100 / openFlexPanels.length}%` } as CSSProperties;
    let postfix =
      selectedEntity.entity?.component?.componentName !== selectedEntity.entity?.video?.componentName
        ? ' Monitor'
        : null;

    return (
      <>
        {layouts.length ? (
          <>
            <section className={styles.chrome}>
              <EntitySelector />
              <CloseAllButton />
            </section>
            <section className={styles.head}>
              {selectedEntity.entity?.metadata.displayName ?? $site.get()?.name}
              {postfix}
            </section>
            <section className={createClassName(styles.panels)} data-count={openFlexPanels.length} style={style}>
              {layouts}
            </section>
          </>
        ) : (
          children
        )}
        {layers}
      </>
    );
  }, [openPanels, selectedEntity]);

  useEffect(() => {
    if (selectedPanelIds) {
      const openPanels = $openPanels.get();

      selectedPanelIds?.forEach((panelId) => {
        openPanels.add(panelId);
      });

      $openPanels.set(new Set(openPanels));
    }
  }, [selectedPanelIds]);

  useEffect(() => {
    if (!isEmpty(autoOpenPanels) && selectedEntity.entity) {
      const openPanels = $openPanels.get();

      autoOpenPanels?.forEach((autoOpenPanel) => {
        const panelId = autoOpenPanel(selectedEntity.entity!);
        if (panelId) openPanels.add(panelId);
      });

      $openPanels.set(new Set(openPanels));
    }
  }, [autoOpenPanels, selectedEntity]);

  return (
    <main className={createClassName(styles.root, className)} data-has-panels={openFlexPanels.length > 0} {...props}>
      {panels}
      <PanelButtons configs={configs} />
    </main>
  );
}

function EntitySelector() {
  const openPanels = useStore($openPanels);
  const entityList = useStore($entityList);
  const selectedEntity = useStore($selectedEntity);

  if (openPanels.size == 0) return null;

  const siteName = $site.get()?.name ?? null;

  const sortedEntityEntities = entityList.sort((a, b) => {
    if (a.metadata.displayName === b.metadata.displayName) return 0;
    return a.metadata.displayName < b.metadata.displayName ? -1 : 1;
  });

  const items: Record<string, ReactNode> = {
    '-': (
      <MenuItem
        label={
          <>
            <GlobeIcon data-menu-item-logo data-globe />
            {siteName}
          </>
        }
        selected={isEmpty(selectedEntity.entity)}
      />
    )
  };

  sortedEntityEntities.forEach((entity) => {
    items[entity.entityId] = (
      <MenuItem
        label={
          <>
            {entity.component ? <SensorIcon data-menu-item-logo /> : <span />}
            {entity.metadata.displayName}
          </>
        }
        selected={entity.entityId === selectedEntity?.entity?.entityId}
      />
    );
  });

  return (
    <DropDownMenu
      className={styles.entitySelector}
      items={items}
      onSelect={(key) => {
        const entity = $entities.get()[key] ?? null;
        $selectedEntity.set({ entity, originId: null });
      }}
      selectedKey={selectedEntity?.entity?.entityId ?? '-'}
    >
      <main data-trigger>
        {selectedEntity.entity?.metadata.displayName ? (
          <>
            {selectedEntity.entity.component && <SensorIcon data-trigger-icon />}
            {selectedEntity.entity.metadata.displayName}
          </>
        ) : (
          <>
            <GlobeIcon data-trigger-icon data-globe /> {siteName}
          </>
        )}
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

function CloseAllButton() {
  const openPanels = useStore($openPanels);

  if (openPanels.size == 0) return null;

  return (
    <button className={styles.closeAllIcon} onPointerUp={resetOpenPanels}>
      <CloseAllIcon />
    </button>
  );
}

function PanelButtons({ configs }: { configs: PanelConfig[] }) {
  return (
    <main className={styles.controls}>
      {configs.map((config) => (
        <PanelButton key={config.id} {...config} />
      ))}
    </main>
  );
}

function PanelButton({ button: { icon, label }, id, onClose }: PanelConfig) {
  const openPanels = useStore($openPanels);

  return (
    <button
      data-panel-button
      data-is-selected={openPanels.has(id)}
      onPointerUp={({ altKey }: PointerEvent<HTMLButtonElement>) => {
        const isOpen = togglePanel(id, altKey);
        if (onClose && !isOpen) onClose();
      }}
    >
      <div data-icon>{icon}</div>
      <div data-label>{label}</div>
    </button>
  );
}
