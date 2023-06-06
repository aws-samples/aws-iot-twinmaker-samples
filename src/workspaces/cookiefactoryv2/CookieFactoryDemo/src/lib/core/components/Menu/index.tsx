// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { useCallback, type PointerEventHandler, type ReactNode } from 'react';
import type { ValueOf } from 'type-fest';

import { createClassName, type ClassName } from '../../utils/element';

import styles from './styles.module.css';

type Menu = {
  className?: ClassName;
  items: MenuItem[];
  onPointerUp?: PointerEventCallback;
};

export type MenuItem = {
  component: (props: { id: string; hover?: boolean; selected?: boolean }) => ReactNode;
  id: string;
  selected?: boolean;
};

type PointerEventCallback = (id: ValueOf<MenuItem, 'id'>) => void;

export function Menu({ className, items, onPointerUp }: Menu) {
  return (
    <menu className={createClassName(styles.menu, className)}>
      {items.map((item) => (
        <MenuItem {...item} key={item.id} onPointerUp={onPointerUp} />
      ))}
    </menu>
  );
}

function MenuItem({ component, id, onPointerUp, selected }: MenuItem & { onPointerUp?: PointerEventCallback }) {
  const handlePointerUp = useCallback<PointerEventHandler<HTMLButtonElement>>(() => {
    if (onPointerUp) {
      onPointerUp(id);
    }
  }, []);

  return (
    <button className={styles.menuItem} key={id} onPointerUp={handlePointerUp}>
      {component({ id: id, selected })}
    </button>
  );
}
