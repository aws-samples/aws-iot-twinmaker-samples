// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import type { CSSProperties, ReactNode } from 'react';

import { isArray, isNotNil, isPlainObject, isString } from './lang2';
import type { EmptyObject } from 'type-fest';

export type ClassName = string | string[] | Record<string, boolean> | null | undefined;

export type ComponentProps<T extends { [key: string]: unknown } = EmptyObject> = {
  children?: ReactNode;
  className?: ClassName;
  style?: CSSProperties;
} & T;

/**
 * Returns a normalized class name from arguments of type `ClassName`.
 */
export function createClassName(...args: ClassName[]) {
  const SEPARATOR = ' ';
  return args
    .filter(isNotNil)
    .reduce<string>((accum, arg) => {
      accum += SEPARATOR;

      if (isString(arg)) {
        accum += `${arg}`;
      }

      if (isArray(arg)) {
        accum += `${arg.join(SEPARATOR)}`;
      }

      if (isPlainObject(arg)) {
        accum += `${Object.entries(arg)
          .reduce<string[]>((accum, [key, value]) => {
            if (value) {
              accum.push(key);
            }
            return accum;
          }, [])
          .join(SEPARATOR)}`;
      }

      return accum;
    }, '')
    .trim();
}

export function findAncestor(child: HTMLElement | null, test: (element: HTMLElement) => boolean) {
  while (child) {
    if (test(child)) return child;
    child = child.parentElement;
  }
  return null;
}
