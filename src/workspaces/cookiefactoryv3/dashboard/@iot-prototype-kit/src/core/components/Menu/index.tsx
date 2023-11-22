// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { useCallback, type PointerEventHandler, type ReactNode } from 'react';

import { createClassName, type ComponentProps } from '@iot-prototype-kit/core/utils/element';

export type MenuProps = {
  items: Record<string, ReactNode>;
  onPointerUp?: (key: string) => void;
  selectedKey?: string;
};

export const Menu = ({ children, className, items, onPointerUp, selectedKey, ...props }: ComponentProps<MenuProps>) => {
  const handlePointerUp = useCallback<PointerEventHandler<HTMLButtonElement>>(({ currentTarget }) => {
    const key = currentTarget.dataset['key'];
    if (onPointerUp && key) onPointerUp(key);
  }, []);

  const selectedRef = useCallback((ref: HTMLButtonElement | null) => {
    ref?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  return (
    <menu className={createClassName(className)} data-menu {...props}>
      {Object.entries(items).map(([key, element]) => (
        <button
          data-key={key}
          key={key}
          onPointerUp={handlePointerUp}
          ref={selectedKey === key ? selectedRef : undefined}
        >
          {element}
        </button>
      ))}
    </menu>
  );
};
