// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import type { ReactNode } from 'react';
import type { EmptyObject, Except } from 'type-fest';

import { useStore } from '@iot-prototype-kit/core/store';
import { CloseIcon } from '@iot-prototype-kit/components/svgs/icons/CloseIcon';
import { ExpandIcon } from '@iot-prototype-kit/components/svgs/icons/ExpandIcon';
import { createClassName, type ComponentProps } from '@iot-prototype-kit/core/utils/element';
import { $openFlexPanelCount, closePanel, expandPanel } from '@iot-prototype-kit/stores/panel';

import styles from './styles.module.css';

export type PanelProps<T extends { [key: string]: unknown } = EmptyObject> = Except<
  ComponentProps<
    T & {
      collapseControlBar?: boolean;
      controls?: ReactNode | ReactNode[];
      id: string;
      isExpandable?: boolean;
      label: string;
      layer?: 'tl' | 'tr' | 'br' | 'bl';
      onClose?: () => void;
    }
  >,
  'children'
>;

export function Panel<T extends { [key: string]: unknown } = EmptyObject>({
  children,
  className,
  collapseControlBar,
  controls,
  id,
  isExpandable,
  label,
  layer,
  onClose,
  ...props
}: PanelProps<T> & { children?: ReactNode }) {
  const openFlexPanelCount = useStore($openFlexPanelCount);

  return (
    <main
      className={createClassName(styles.root, className)}
      data-collapse-control-bar={collapseControlBar === true}
      data-layer={layer}
      {...props}
    >
      <section className={styles.head}>
        <div className={styles.label}>{label}</div>
        <div className={styles.controls}>
          {controls}
          {(isExpandable ?? openFlexPanelCount > 1) && <ExpandButton id={id} />}
          <CloseButton id={id} onClose={onClose} />
        </div>
      </section>
      {children}
    </main>
  );
}

function CloseButton({ id, onClose }: { id: string; onClose?: () => void }) {
  return (
    <button
      className={createClassName(styles.controlIcon, styles.closeIcon)}
      onPointerUp={() => {
        closePanel(id);
        if (onClose) onClose();
      }}
    >
      <CloseIcon />
    </button>
  );
}

function ExpandButton({ id }: { id: string }) {
  return (
    <button className={styles.controlIcon} onPointerUp={() => expandPanel(id)}>
      <ExpandIcon />
    </button>
  );
}
