// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useMemo, type PointerEventHandler } from 'react';

import { SITE_TYPE } from '@/config/sites';
import { PanelLayout } from '@/lib/components/layouts';
import { CloseAllIcon } from '@/lib/components/svgs/icons';
import { ArrowHeadDownIcon, GlobeIcon } from '@/lib/components/svgs/icons';
import { CookieFactoryLogoWide } from '@/lib/components/svgs/logos';
import { useMenu } from '@/lib/core/hooks';
import { createClassName, type ClassName } from '@/lib/core/utils/element';
import { isNil } from '@/lib/core/utils/lang';
import { normalizedEntityData } from '@/lib/init/entities';
import { PANELS } from '@/lib/init/panels';
import { useSelectedStore } from '@/lib/stores/entity';
import { usePanelsStore } from '@/lib/stores/panels';
import { useSiteStore } from '@/lib/stores/site';
import type { Panel } from '@/lib/types';

import controlStyles from './control.module.css';
import styles from './styles.module.css';

const VIEW_LABEL = 'Monitor';

export function PanelView({ className }: { className?: ClassName }) {
  const [panels, setPanels] = usePanelsStore();
  const [selectedEntity] = useSelectedStore();

  const viewLabel = useMemo(() => {
    return `${selectedEntity.entityData ? selectedEntity.entityData.type : SITE_TYPE} ${VIEW_LABEL}`;
  }, [selectedEntity]);

  const closeAllButton = useMemo(() => {
    return panels.size ? (
      <button
        className={styles.closeAllIcon}
        key={crypto.randomUUID()}
        onPointerUp={() =>
          setPanels((state) => {
            state.clear();
            return state;
          })
        }
      >
        <CloseAllIcon />
      </button>
    ) : null;
  }, [panels]);

  return (
    <main className={createClassName(styles.root, className)} data-has-panels={panels.size > 0}>
      <section className={styles.viewInfo}>
        {viewLabel}
        {closeAllButton}
      </section>
      {panels.size ? <Panels /> : <EmptyState />}
      <ControlLayout />
    </main>
  );
}

function Panels() {
  const [panels] = usePanelsStore();
  const [selectedEntity, setSelectedEntity] = useSelectedStore();
  const [site] = useSiteStore();

  if (panels.size > 0) {
    const entities: {
      component: (props: {
        id: string;
        hover?: boolean | undefined;
        selected?: boolean | undefined;
      }) => React.ReactNode;
      id: string;
    }[] = normalizedEntityData
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(({ entityId, name }) => {
        return {
          component: ({ selected }) => (
            <main className={createClassName(styles.menuItem)} data-selected={selected === true}>
              <section className={styles.menuItemLabel}>{name}</section>
            </main>
          ),
          id: entityId
        };
      });

    const { handleTrigger, menu, menuContainerRef, selectedId, selectedRef } = useMenu(
      [
        {
          component: ({ selected }) => (
            <main className={createClassName(styles.menuItem)} data-selected={selected === true}>
              <section className={styles.menuItemLabel}>
                <GlobeIcon className={styles.menuItemIcon} />
                <span>{site!.name}</span>
              </section>
            </main>
          ),
          id: site!.id
        },
        ...entities
      ],
      {
        className: createClassName(styles.menu),
        selectedId: selectedEntity.entityData ? selectedEntity.entityData?.entityId : site!.id
      }
    );

    const head = useMemo(() => {
      if (selectedEntity.entityData) {
        return (
          <div className={styles.triggerNameGroup}>
            <div className={styles.entityName}>{selectedEntity.entityData.name}</div>
            {selectedEntity.entityData.type && (
              <div className={styles.entityType}>{selectedEntity.entityData.type}</div>
            )}
          </div>
        );
      }

      if (site) {
        return (
          <div className={styles.triggerNameGroup}>
            <div className={styles.entityName}>{site?.name}</div>
            <div className={styles.entityType}>{SITE_TYPE}</div>
          </div>
        );
      }
    }, [panels, selectedEntity, site]);

    const panelElements = useMemo(() => {
      const isExpandable = panels.size > 1;

      return PANELS.sort((a, b) => a.priority - b.priority)
        .sort((a, b) => a.slot - b.slot)
        .reduce<JSX.Element[]>((accum, panel) => {
          if (panels.has(panel.id)) {
            accum.push(<PanelLayout key={panel.id} isExpandable={isExpandable} panel={panel} />);
          }

          return accum;
        }, []);
    }, [panels]);

    useEffect(() => {
      if (selectedId) {
        const entityData = normalizedEntityData.find(({ entityId }) => entityId === selectedId) ?? null;
        setSelectedEntity({ entityData, type: null });
      }
    }, [selectedId]);

    useEffect(() => {
      selectedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [menu]);

    return (
      <>
        <section className={styles.head} ref={menuContainerRef}>
          <button className={styles.trigger} data-active={!isNil(menu)} onPointerUp={handleTrigger}>
            {head}
            <ArrowHeadDownIcon className={styles.triggerArrow} />
          </button>
          {menu}
        </section>
        <section className={createClassName(styles.panels)} data-count={panels.size}>
          {panelElements}
        </section>
      </>
    );
  }

  return null;
}

function ControlLayout({ className }: { className?: ClassName }) {
  const group1 = PANELS.filter(({ slot }) => slot === 1);
  const group2 = PANELS.filter(({ slot }) => slot === 2);

  return (
    <main className={createClassName(styles.controls, className)}>
      {group1.length > 0 ? (
        <section className={styles.controlGroup}>
          {group1.map((panel) => (
            <Control key={panel.id} panel={panel} />
          ))}
        </section>
      ) : null}
      {group2.length > 0 ? (
        <section className={styles.controlGroup}>
          {group2.map((panel) => (
            <Control key={panel.id} panel={panel} />
          ))}
        </section>
      ) : null}
    </main>
  );
}

function Control({ panel: { icon, id, label } }: { panel: Panel }) {
  const [panelsStore, setPanelStore] = usePanelsStore();

  const handlePointerUp = useCallback<PointerEventHandler<HTMLButtonElement>>(({ nativeEvent: { altKey } }) => {
    setPanelStore((state) => {
      const hasPanelId = state.has(id);

      if (altKey) {
        if (hasPanelId && state.size === 1) {
          state.clear();
        } else {
          state.clear();
          state.add(id);
        }
      } else {
        if (hasPanelId) {
          const filtered = [...state.values()].filter((panelId) => panelId !== id);
          state.clear();
          filtered.forEach(state.add, state);
        } else {
          state.add(id);
        }
      }
      return state;
    });
  }, []);

  return (
    <button
      className={controlStyles.button}
      data-is-active={panelsStore.size > 0}
      data-is-selected={panelsStore.has(id)}
      onPointerUp={handlePointerUp}
    >
      <div className={controlStyles.icon}>{icon}</div>
      <div className={controlStyles.label}>{label}</div>
    </button>
  );
}

function EmptyState() {
  return (
    <main className={styles.emptyState}>
      <CookieFactoryLogoWide className={styles.emptyStateLogo} />
    </main>
  );
}
