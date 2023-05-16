// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

type Primitive = number | string | boolean | bigint | symbol | null | undefined;

export function debounce<T extends any[]>(fn: (...args: T) => void, delay: number, immediate = false) {
  let timeout: NodeJS.Timeout | undefined;

  return function (...args: T) {
    if (immediate && timeout == undefined) {
      fn.apply(fn, args);
    }

    clearTimeout(timeout);

    timeout = setTimeout(() => {
      timeout = undefined;

      if (!immediate) {
        fn.apply(fn, args);
      }
    }, delay);
  };
}

/**
 * Invokes `func` after `delay` milliseconds. Any additional arguments are provided to `func` when it's invoked.
 */
export function delay<T extends any[]>(func: (...args: T) => void, delay: number, ...args: T) {
  return setTimeout(() => func.apply(func, args), delay);
}

export function isEven(value: number) {
  return (~value & 1) === 1;
}

export function isOdd(value: number) {
  return (value & 1) === 1;
}

export function isArray(value: any): value is any[] {
  return Array.isArray(value);
}

export function isBoolean(value: any): value is boolean {
  return !isNil(value) && (typeof value === 'boolean' || value instanceof Boolean);
}

export function isDefined<T extends any>(value: T): value is Exclude<T, undefined> {
  return value !== undefined;
}

/**
 * Checks if `value` is a  DOM element.
 */
export function isElement(value: any): value is HTMLElement {
  return value instanceof HTMLElement;
}

export function isFunction(value: any): value is Function {
  return !isNil(value) && typeof value === 'function';
}

export function isNil(value: any): value is null | undefined {
  return value == undefined;
}

export function isNotNil<T extends any>(value: T): value is Exclude<T, null | undefined> {
  return value != undefined;
}

export function isNotNull<T extends any>(value: T): value is Exclude<T, null> {
  return value !== null;
}

export function isNull(value: any): value is null {
  return value === null;
}

export function isNumber(value: any): value is number {
  return !isNil(value) && (typeof value === 'number' || value instanceof Number);
}

export function isPlainObject<T extends any>(
  value: T
): value is Exclude<T, Array<any> | Function | symbol | Primitive> {
  return !isNil(value) && typeof value === 'object' && (value as Object).constructor.name === 'Object';
}

export function isString(value: any): value is string {
  return !isNil(value) && (typeof value === 'string' || value instanceof String);
}

export function isSvgElement(value: any): value is SVGElement {
  return value instanceof SVGElement;
}

export function isUndefined(value: any): value is undefined {
  return value === undefined;
}

export function lastItem<T>(arr: T[], count = 1): T | undefined {
  return arr[arr.length - count];
}

export function takeRight<T>(arr: T[], count = 1): T[] {
  return arr.slice(Math.max(arr.length - count, 0));
}

/**
 * Invokes `func` on next exeuction of the event loop. Any additional arguments are provided to `func` when it's invoked.
 */
export function nextTick<T extends any[]>(func: (...args: T) => void, ...args: T) {
  return setTimeout(() => func.apply(func, args), 0);
}

export function throttle<T extends any[]>(fn: (...args: T) => void, delay: number, immediate = false) {
  let timeout: NodeJS.Timeout | undefined;

  return function (...args: T) {
    if (timeout == undefined) {
      if (immediate) {
        fn.apply(fn, args);
      }

      timeout = setTimeout(() => {
        timeout = undefined;

        if (!immediate) {
          fn.apply(fn, args);
        }
      }, delay);
    }
  };
}
