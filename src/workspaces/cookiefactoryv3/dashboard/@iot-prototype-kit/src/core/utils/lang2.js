// @ts-check

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * @template T
 * @param {T[]} arr
 * @param {number} size
 */
export function chunk(arr, size) {
  /** @type {T[][]} */
  const chunks = [];

  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }

  return chunks;
}

/**
 * @template {(...args: any[]) => any} T
 * @param {T} callback
 * @param {number} delay
 * @param {boolean} immediate
 * @returns {(...args: Parameters<T>) => ReturnType<T> | void}
 */
export function debounce(callback, delay, immediate = false) {
  /** @type {NodeJS.Timeout | undefined} */
  let timeout;

  return (...args) => {
    if (immediate && timeout === undefined) {
      callback(...args);
    }

    clearTimeout(timeout);

    timeout = setTimeout(() => {
      timeout = undefined;

      if (!immediate) {
        return callback(...args);
      }
    }, delay);
  };
}

/**
 * @template T
 * @param {(...args: T[]) => void}  callback
 * @param {number} delay
 * @param {T[]} args
 * @returns {NodeJS.Timeout}
 */
export function delay(callback, delay, ...args) {
  return setTimeout(callback, delay, ...args);
}

/**
 * @template T
 * @param {T[]} arr
 * @param {number} size
 */
export function* generateChunks(arr, size) {
  for (let i = 0; i < arr.length; i += size) {
    yield arr.slice(i, i + size);
  }
}

/**
 * @template T
 * @param {T[]} arr
 */
export function* generateItems(arr) {
  for (let i = 0; i < arr.length; i++) {
    yield arr[i];
  }
}

/**
 * @param {Object.<string, unknown>} obj
 * @param {string} key
 */
export function has(obj, key) {
  return Object.getOwnPropertyNames(obj).includes(key);
}

/**
 * @template T
 * @param {T} value
 * @returns {value is any[]}
 */
export function isArray(value) {
  return Array.isArray(value);
}

/**
 * @template T
 * @param {T} value
 * @returns {value is boolean}
 */
export function isBoolean(value) {
  return typeof value === 'boolean' || value instanceof Boolean;
}

/**
 * @template T
 * @param {T} value
 * @returns {value is Date}
 */
export function isDate(value) {
  return value instanceof Date;
}

/**
 * @template T
 * @param {T} value
 * @returns {value is Exclude<T, undefined>}
 */
export function isDefined(value) {
  return value !== undefined;
}

/**
 * @template T
 * @param {T} value
 * @returns {value is HTMLElement}
 */
export function isElement(value) {
  return value instanceof HTMLElement;
}

/**
 * @template T
 * @param {T} value
 * @returns { value is undefined | null | false | 0 | never[] | '' |  Record<string,never>}
 */
export function isEmpty(value) {
  if (isNil(value)) return true;
  if (value === false) return true;
  if (value === 0) return true;
  if ((isArray(value) || isString(value)) && value.length === 0) return true;
  if (value instanceof Map && value.size === 0) return true;
  if (value instanceof Set && value.size === 0) return true;
  if (isPlainObject(value) && Object.keys(value).length === 0) return true;
  return false;
}

/**
 * @param {number} value
 */
export function isEven(value) {
  return (value & 1) === 0;
}

/**
 * @template T
 * @param {T} value
 * @returns {value is Function}
 */
export function isFunction(value) {
  return typeof value === 'function';
}

/**
 * @template T
 * @param {T} value
 * @returns {value is null | undefined}
 */
export function isNil(value) {
  return value == undefined;
}

/**
 * @template T
 * @param {T} value
 * @returns {value is Exclude<T, null | undefined>}
 */
export function isNotNil(value) {
  return value != undefined;
}

/**
 * @template T
 * @param {T} value
 * @returns {value is Exclude<T, null>}
 */
export function isNotNull(value) {
  return value !== null;
}

/**
 * @template T
 * @param {T} value
 * @returns {value is null}
 */
export function isNull(value) {
  return value === null;
}

/**
 * @template T
 * @param {T} value
 * @returns {value is number}
 */
export function isNumber(value) {
  return typeof value === 'number' || value instanceof Number;
}

/**
 *
 * @param {number} value
 * @returns
 */
export function isOdd(value) {
  return (value & 1) === 1;
}

/**
 * @template T
 * @param {T} value
 * @returns {value is Record<string, unknown>}
 */
export function isPlainObject(value) {
  return typeof value === 'object' && value?.constructor.name === 'Object';
}

/**
 * @template T
 * @param {T} value
 * @returns {value is string}
 */
export function isString(value) {
  return typeof value === 'string' || value instanceof String;
}

/**
 * @template T
 * @param {T} value
 * @returns {value is SVGElement}
 */
export function isSvgElement(value) {
  return value instanceof SVGElement;
}

/**
 * @template T
 * @param {T} value
 * @returns {value is undefined}
 */
export function isUndefined(value) {
  return value === undefined;
}

/**
 * @template T
 * @param {T[]} arr
 * @param {number} [count=1]
 * @returns { T | undefined}
 */
export function lastItem(arr, count = 1) {
  return arr[arr.length - count];
}

/**
 * @template {unknown[]} T
 * @param {(...args: T) => void} callback
 * @param  {T} args
 */
export function nextTick(callback, ...args) {
  return setTimeout(callback, 0, ...args);
}

/**
 * @template T
 * @param {T[]} arr
 * @param {number} [count=1]
 * @returns { T[]}
 */
export function takeRight(arr, count = 1) {
  return arr.slice(Math.max(arr.length - count, 0));
}

/**
 * @template {(...args: any[]) => any} T
 * @param {T} fn
 * @param {number} delay
 * @param {boolean} immediate
 * @returns {(...args: Parameters<T>) => ReturnType<T> | void}
 */
export function throttle(fn, delay, immediate = false) {
  /** @type {number | undefined} */
  let timestamp = undefined;

  return (...args) => {
    const now = Date.now();

    if ((immediate && timestamp === undefined) || (timestamp !== undefined && now - timestamp > delay)) {
      timestamp = now;
      return fn(...args);
    }

    if (!immediate && timestamp === undefined) {
      timestamp = now;
    }
  };
}
