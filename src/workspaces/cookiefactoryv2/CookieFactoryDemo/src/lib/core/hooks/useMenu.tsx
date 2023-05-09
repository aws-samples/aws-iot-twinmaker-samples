// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import { useCallback, useState, useMemo, type PointerEventHandler, useRef } from 'react';
import type { Except, ValueOf } from 'type-fest';

import { Menu, type MenuItem } from '@/lib/core/components';
import type { ClassName } from '@/lib/core/utils/element';
import { useClickWithin } from './useClickWithin';

export function useMenu<T>(
  items: Except<MenuItem, 'selected'>[],
  { className, selectedId }: Partial<{ className: ClassName; selectedId: ValueOf<MenuItem, 'id'> }> = {}
) {
  const { ref: menuContainerRef, isClickWithin, setClickWithin } = useClickWithin(false);
  const [_selectedId, setSelectedId] = useState(selectedId);

  const _items = useMemo(() => {
    return items.map((item) => {
      return { ...item, selected: item.id === _selectedId };
    });
  }, [_selectedId]);

  const handleTrigger = useCallback<PointerEventHandler<HTMLButtonElement>>(() => {
    setClickWithin((isClickWithin) => !isClickWithin);
  }, []);

  const handlePointerUp = useCallback((id: ValueOf<MenuItem, 'id'>) => {
    setClickWithin(false);
    setSelectedId(id);
  }, []);

  const menu = useMemo(() => {
    return isClickWithin ? <Menu className={className} items={_items} onPointerUp={handlePointerUp} /> : null;
  }, [className, isClickWithin, _items, handlePointerUp]);

  return { handleTrigger, menu, menuContainerRef, selectedId: _selectedId };
}
