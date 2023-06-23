// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useMemo } from 'react';

import { createClassName, type ClassName } from '@/lib/core/utils/element';
import { CloseIcon, ExpandIcon } from '@/lib/components/svgs/icons';
import { panelsStore } from '@/lib/stores/panels';
import type { Panel } from '@/lib/types';

import styles from './styles.module.css';

export function PanelLayout({
  className,
  isExpandable,
  panel: { content, icon, id, label }
}: {
  className?: ClassName;
  isExpandable?: boolean;
  panel: Panel;
}) {
  const handleClose = useCallback(() => {
    panelsStore.setState((state) => {
      if (state.has(id)) {
        const filtered = [...state.values()].filter((panelId) => panelId !== id);
        state.clear();
        filtered.forEach(state.add, state);
      }

      return state;
    });
  }, []);

  const handleExpand = useCallback(() => {
    panelsStore.setState((state) => {
      state.clear();
      state.add(id);
      return state;
    });
  }, []);

  const expandControlElement = useMemo(() => {
    return isExpandable ? (
      <button className={styles.controlIcon} onPointerUp={handleExpand}>
        <ExpandIcon />
      </button>
    ) : null;
  }, [isExpandable]);

  return (
    <main className={createClassName(styles.root, className)}>
      <section className={styles.head}>
        <section className={styles.label}>{label}</section>
        <section className={styles.controls}>
          {expandControlElement}
          <button className={createClassName(styles.controlIcon, styles.closeIcon)} onPointerUp={handleClose}>
            <CloseIcon />
          </button>
        </section>
      </section>
      <section className={styles.body}>{content}</section>
    </main>
  );
}
