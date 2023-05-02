// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import { useCallback, useMemo } from 'react';

import { usePanelState } from '@/lib/state/panel';
import { CloseIcon, ExpandIcon } from '@/lib/components/svgs/icons';
import { createClassName, type ClassName } from '@/lib/utils/element';
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
  const [, setPanelState] = usePanelState();

  const handleCloseClick = useCallback(() => {
    setPanelState((panels) => {
      if (panels.includes(id)) {
        const filtered = panels.filter((panelId) => panelId !== id);
        panels.length = 0;
        panels.push(...filtered);
      }
      return panels;
    });
  }, []);

  const handleExpandClick = useCallback(() => {
    setPanelState([id]);
  }, []);

  const expandControlElement = useMemo(() => {
    return isExpandable ? (
      <button className={styles.controlIcon} onClick={handleExpandClick}>
        <ExpandIcon />
      </button>
    ) : null;
  }, [isExpandable]);

  return (
    <main className={createClassName(styles.root, className)}>
      <section className={styles.head}>
        <section className={styles.group}>
          <span className={styles.icon}>{icon}</span>
          <span className={styles.label}>{label}</span>
        </section>
        <section className={styles.group}>
          {expandControlElement}
          <button className={createClassName(styles.controlIcon, styles.closeIcon)} onClick={handleCloseClick}>
            <CloseIcon />
          </button>
        </section>
      </section>
      <section className={styles.body}>{content}</section>
    </main>
  );
}
