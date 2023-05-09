// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import type { CSSProperties, ReactNode } from 'react';

import { BellOutlinedIcon, ListIcon, MessagesIcon } from '@/lib/components/svgs/icons';
import { createClassName, type ClassName } from '@/lib/core/utils/element';
import { usePanelState } from '@/lib/stores/panel';
import type { PanelId } from '@/lib/types';

import styles from './styles.module.css';

export function SiteActivity({ className }: { className?: ClassName }) {
  return (
    <section className={createClassName(styles.root, className)}>
      <InfoItem id="events" icon={<BellOutlinedIcon />} />
      <InfoItem id="tickets" icon={<ListIcon />} />
      <InfoItem id="messages" icon={<MessagesIcon />} />
    </section>
  );
}

function InfoItem({
  className,
  icon,
  id,
  style,
  value = 0
}: {
  className?: ClassName;
  icon: ReactNode;
  id: PanelId;
  style?: CSSProperties;
  value?: number;
}) {
  const [, setPanelState] = usePanelState();

  return (
    <section className={createClassName(styles.group, className)} onPointerUp={() => setPanelState([id])} style={style}>
      <span className={styles.icon}>{icon}</span>
      <span className={styles.label}>{value}</span>
    </section>
  );
}
