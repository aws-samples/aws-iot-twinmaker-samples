// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import { useCallback, useEffect, useMemo } from 'react';
import type { MouseEventHandler } from 'react';

import { PanelLayout } from '@/lib/components/layouts';
import { CloseAllIcon } from '@/lib/components/svgs/icons';
import { CookieFactoryLogoWide } from '@/lib/components/svgs/logos';
import { PANELS } from '@/lib/panels';
import { globalControlState, useGlobalControlState } from '@/lib/state/control';
import { panelState, usePanelState } from '@/lib/state/panel';
import type { GlobalControl, Panel, PanelId } from '@/lib/types';
import { createClassName, type ClassName } from '@/lib/utils/element';

import controlStyles from './control.module.css';
import styles from './styles.module.css';

const closeAllControl = (
  <button className={styles.closeAllIcon} key={crypto.randomUUID()} onPointerDown={() => panelState.setState([])}>
    <CloseAllIcon />
  </button>
);

export function PanelView({ className }: { className?: ClassName }) {
  const [, setGlobalControl] = useGlobalControlState();
  const [panelState] = usePanelState();

  useEffect(() => {
    if (panelState.length) {
      setGlobalControl((globalControl) => {
        return !globalControl.includes(closeAllControl) ? [...globalControl, closeAllControl] : globalControl;
      });
    } else {
      setGlobalControl((globalControl) => removeGlobalControls(globalControl));
    }
  }, [panelState]);

  useEffect(() => {
    return () => globalControlState.setState(removeGlobalControls);
  }, []);

  return (
    <main className={createClassName(styles.root, className)}>
      <Panels />
      <ControlLayout />
    </main>
  );
}

function Panels() {
  const [panelState] = usePanelState();
  const isExpandable = useMemo(() => panelState.length > 1, [panelState]);

  const panelElements = useMemo(() => {
    return PANELS.sort((a, b) => a.priority - b.priority).map((panel) => (
      <PanelLayout
        className={createClassName({ [styles.isHidden]: panelState.find((id) => id == panel.id) === undefined })}
        key={panel.id}
        isExpandable={isExpandable}
        panel={panel}
      />
    ));
  }, [panelState]);

  return (
    <main className={createClassName(styles.panels)} data-count={panelState.length}>
      {panelElements}
      {panelState.length === 0 && <EmptyState />}
    </main>
  );
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
  const [panelState, setPanelState] = usePanelState();

  const handleClick = useCallback<MouseEventHandler<HTMLButtonElement>>(({ nativeEvent: { altKey } }) => {
    setPanelState((panels) => {
      const hasPanelId = panels.includes(id);

      if (altKey) {
        if (hasPanelId && panels.length === 1) {
          panels.length = 0;
        } else {
          panels.length = 0;
          panels.push(id);
        }
      } else {
        if (hasPanelId) {
          const filtered = panels.filter((panelId) => panelId !== id);
          panels.length = 0;
          panels.push(...filtered);
        } else {
          panels.push(id);
        }
      }
      return panels;
    });
  }, []);

  return (
    <button
      className={createClassName(controlStyles.root, {
        [controlStyles.active]: panelState.length > 0,
        [controlStyles.selected]: panelState.includes(id)
      })}
      onClick={handleClick}
    >
      <section className={controlStyles.group}>
        <div className={controlStyles.icon}>{icon}</div>
        <div className={controlStyles.label}>{label}</div>
      </section>
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

function removeGlobalControls(controls: GlobalControl[]) {
  return controls.filter((control) => control !== closeAllControl);
}

function getViewData(panelIds: PanelId[]) {
  return panelIds.reduce<Panel[]>((accum, id) => {
    const panel = PANELS.find((panel) => panel.id === id);
    if (panel) accum.push(panel);
    return accum;
  }, []);
}
