// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import { ReactNode, useCallback, type PointerEventHandler } from 'react';
import type { ValueOf } from 'type-fest';

import { createClassName, type ClassName } from '@/lib/utils/element';

import styles from './styles.module.css';

type Menu<T> = {
  className?: ClassName;
  items: MenuItem<T>[];
  onPointerDown?: PointerEventCallback<T>;
};

export type MenuItem<T> = {
  component: (props: { id: string; hover?: boolean; selected?: boolean }) => ReactNode;
  id: string;
  selected?: boolean;
};

type PointerEventCallback<T> = (id: ValueOf<MenuItem<T>, 'id'>) => void;

export function Menu<T>({ className, items, onPointerDown }: Menu<T>) {
  return (
    <menu className={createClassName(styles.menu, className)}>
      {items.map((item) => (
        <MenuItem {...item} key={item.id} onPointerDown={onPointerDown} />
      ))}
    </menu>
  );
}

function MenuItem<T>({
  component,
  id,
  onPointerDown,
  selected
}: MenuItem<T> & { onPointerDown?: PointerEventCallback<T> }) {
  const handlePointerDown = useCallback<PointerEventHandler<HTMLButtonElement>>(({ buttons }) => {
    onPointerDown && buttons === 1 && onPointerDown(id);
  }, []);

  return (
    <button
      className={createClassName(styles.menuItem, { [styles.selected]: selected === true })}
      key={id}
      onMouseDown={handlePointerDown}
    >
      {component({ id: id, selected })}
    </button>
  );
}
