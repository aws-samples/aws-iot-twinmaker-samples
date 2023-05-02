// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import { useCallback, useState, useMemo, type PointerEventHandler } from 'react';
import type { Except, ValueOf } from 'type-fest';

import { Menu, type MenuItem } from '@/lib/components/core';
import { useClickWithin } from '@/lib/hooks';
import type { ClassName } from '@/lib/utils/element';

export function useMenu<T>(
  items: Except<MenuItem<T>, 'selected'>[],
  { className, selectedId }: Partial<{ className: ClassName; selectedId: ValueOf<MenuItem<T>, 'id'> }> = {}
) {
  const { ref: menuContainerRef, isClickWithin, setClickWithin } = useClickWithin(false);
  const [_selectedId, setSelectedId] = useState(selectedId);

  const _items = useMemo(() => {
    return items.map((item) => {
      return { ...item, selected: item.id === _selectedId };
    });
  }, [_selectedId]);

  const handleTrigger = useCallback<PointerEventHandler<HTMLButtonElement>>(
    ({ buttons }) => {
      buttons === 1 && setClickWithin((isClickWithin) => !isClickWithin);
    },
    [isClickWithin]
  );

  const handlePointerDown = useCallback((id: ValueOf<MenuItem<T>, 'id'>) => {
    setClickWithin(false);
    setSelectedId(id);
  }, []);

  const menu = useMemo(() => {
    return isClickWithin ? <Menu className={className} items={_items} onPointerDown={handlePointerDown} /> : null;
  }, [className, isClickWithin, _items, handlePointerDown]);

  return { handleTrigger, menu, menuContainerRef, selectedId: _selectedId };
}
