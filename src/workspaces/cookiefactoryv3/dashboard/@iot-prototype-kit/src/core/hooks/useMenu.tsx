// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { useCallback } from 'react';
import type { PointerEventHandler } from 'react';
import type { ValueOf } from 'type-fest';

import { Menu, type MenuProps } from '@iot-prototype-kit/core/components/Menu';

import { useClickWithin } from './useClickWithin';

export function useMenu(
  items: ValueOf<MenuProps, 'items'>,
  onSelect: (key: string) => void,
  { selectedKey }: Partial<{ selectedKey: string }> = {}
) {
  const { ref: menuContainerRef, isClickWithin, setClickWithin } = useClickWithin(false);

  const handlePointerUp = useCallback(
    (key: string) => {
      setClickWithin(false);
      if (key !== selectedKey) onSelect(key);
    },
    [selectedKey]
  );

  const handleTrigger = useCallback<PointerEventHandler<HTMLButtonElement>>(() => {
    setClickWithin((isClickWithin) => !isClickWithin);
  }, []);

  const menu = isClickWithin ? <Menu items={items} onPointerUp={handlePointerUp} selectedKey={selectedKey} /> : null;

  return { handleTrigger, menu, menuContainerRef };
}
