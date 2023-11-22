// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { ValueOf } from 'type-fest';

import { createClassName, type ComponentProps } from '@iot-prototype-kit/core/utils/element';
import { isNumber } from '@iot-prototype-kit/core/utils/lang2';

import './styles.css';

export type GridTableOptions<T extends Record<string, any>> = Partial<{
  columnWidth: GridTableColumnWidth;
  initialSortDescriptor: GridTableSortDescriptor<T>;
}>;

export type GridTableCellRenderCallback = (key: string, value: any) => ReactNode;
export type GridTableColumnWidth = 'auto' | 'max-content' | 'min-content' | number;
export type GridTableColumnRenderCallback = (key: string) => ReactNode;
export type GridTableSortDescriptor<T extends Record<string, any>> = {
  columnName: keyof T;
  direction: GridTableSortDirection;
};
export type GridTableSortDirection = 'ascending' | 'descending';
export type GridTableSelectCallback<T extends Record<string, any>> = (item: T | null) => void;
export type GridTableSortCallback<T extends Record<string, any>> = (
  a: T,
  b: T,
  sortDescriptor: GridTableSortDescriptor<T>
) => number;

export type GridTableData<T extends Record<string, any>> = {
  id: string;
  item: T;
};

export function GridTable<T extends Record<string, any>>({
  children,
  className,
  items,
  onCellRender,
  onColumnRender,
  onSelect,
  onSort,
  options
}: ComponentProps<{
  items: T[];
  onCellRender: GridTableCellRenderCallback;
  onColumnRender: GridTableColumnRenderCallback;
  onSelect?: GridTableSelectCallback<T>;
  onSort?: GridTableSortCallback<T>;
  options?: GridTableOptions<T>;
}>) {
  const itemsCache = useRef<GridTableData<T>[]>([]);
  const [shouldUpdate, setShouldUpdate] = useState(Symbol());
  const [selected, setSelected] = useState<string | null>(null);
  const sortDescriptor = useRef<GridTableSortDescriptor<T> | null>(options?.initialSortDescriptor ?? null);

  const handleHeadClick = useCallback<React.PointerEventHandler<HTMLElement>>(
    ({ currentTarget }) => {
      if (onSort) {
        const columnName = currentTarget.dataset['id'] ?? null;
        const state = sortDescriptor.current;

        if (columnName) {
          let direction = state?.direction ?? 'ascending';

          if (state?.columnName === columnName) {
            direction = state?.direction === 'ascending' ? 'descending' : 'ascending';
          }

          sortDescriptor.current = { columnName, direction };
          sortItems(itemsCache.current, sortDescriptor.current, onSort);
          setShouldUpdate(Symbol());
        }
      }
    },
    [onSort]
  );

  const handleRowClick = useCallback<React.PointerEventHandler<HTMLElement>>(({ currentTarget }) => {
    setSelected((state) => {
      const id = currentTarget.dataset['id'] ?? null;
      return state === id ? null : id;
    });
  }, []);

  const columns = useMemo(() => {
    if (itemsCache.current.length === 0) return null;

    const columnNames = Object.keys(itemsCache.current[0].item);

    return columnNames.reduce<JSX.Element[]>((accum, key) => {
      const child = onColumnRender(key);

      if (child) {
        accum.push(
          <GridTableCell
            key={key}
            id={key}
            label={key}
            onClick={handleHeadClick}
            sortDescriptor={sortDescriptor.current?.columnName === key ? sortDescriptor.current : undefined}
          >
            {child}
          </GridTableCell>
        );
      }

      return accum;
    }, []);
  }, [shouldUpdate, onColumnRender]);

  const rows = useMemo(() => {
    if (itemsCache.current.length === 0) return null;

    return itemsCache.current.map((row) => {
      return (
        <main key={row.id} data-id={row.id} data-row data-selected={row.id === selected} onPointerUp={handleRowClick}>
          {Object.entries(row.item).reduce<JSX.Element[]>((accum, [key, value]) => {
            const child = onCellRender(key, value);

            if (child) {
              accum.push(
                <GridTableCell key={key} id={key}>
                  {child}
                </GridTableCell>
              );
            }

            return accum;
          }, [])}
        </main>
      );
    }, []);
  }, [shouldUpdate, selected, onCellRender]);

  useEffect(() => {
    if (onSelect) {
      const item = itemsCache.current.find((row) => row.id === selected)?.item ?? null;
      onSelect(item);
    }
  }, [selected, onSelect]);

  // For initial items, normalize and sort if the initial sort descriptor is defined
  useEffect(() => {
    itemsCache.current = items.map((item) => {
      return { id: crypto.randomUUID(), item };
    });

    if (onSort) {
      sortItems(itemsCache.current, sortDescriptor.current, onSort);
    }

    setShouldUpdate(Symbol());
  }, [onSort, options, items]);

  const gridTemplateColumns = getColumnWidth(columns?.length ?? 0, options?.columnWidth);

  return columns?.length ? (
    <main
      className={createClassName(className)}
      data-column-size={gridTemplateColumns}
      data-grid-table
      style={{ gridTemplateColumns }}
    >
      <section data-head>{columns}</section>
      <section data-body>{rows}</section>
    </main>
  ) : (
    <>{children}</>
  );
}

function GridTableCell<T extends Record<string, any>>({
  children,
  id,
  label,
  onClick,
  sortDescriptor
}: {
  children?: ReactNode;
  id: string;
  label?: string;
  onClick?: React.PointerEventHandler<HTMLElement>;
  sortDescriptor?: GridTableSortDescriptor<T>;
}) {
  return (
    <main data-cell data-id={id} data-sort={sortDescriptor?.direction} onPointerUp={onClick} title={label}>
      {children}
    </main>
  );
}

function getColumnWidth<T extends Record<string, any>>(
  count: number,
  columnWidth: ValueOf<GridTableOptions<T>, 'columnWidth'>
) {
  let width: string | number = columnWidth ?? '1fr';
  width = `minmax( ${isNumber(width) ? `${width}rem` : width}, 1fr)`;
  return columnWidth == 'auto' ? `repeat(${count - 1}, auto) 1fr` : `repeat(${count}, ${width})`;
}

function sortItems<T extends Record<string, any>>(
  items: GridTableData<T>[],
  sortDescriptor: GridTableSortDescriptor<T> | null,
  callback: GridTableSortCallback<T>
) {
  if (sortDescriptor) {
    items.sort((a, b) => callback(a.item, b.item, sortDescriptor));
  }
  return items;
}
