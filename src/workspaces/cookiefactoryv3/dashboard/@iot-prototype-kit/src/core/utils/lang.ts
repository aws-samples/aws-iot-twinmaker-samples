// // Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// // SPDX-License-Identifier: Apache-2.0
// import { isDate as _isDate } from 'date-fns';
// import type { EmptyObject } from 'type-fest';

// type Primitive = number | string | boolean | bigint | symbol | null | undefined;

// /**
//  * https://stackoverflow.com/a/55435856
//  */
// export function* chunk<T>(arr: T[], chunkSize: number): Generator<T[], void> {
//   for (let i = 0; i < arr.length; i += chunkSize) {
//     yield arr.slice(i, i + chunkSize);
//   }
// }

// export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
//   const result: T[][] = [];
//   while (array.length) {
//     result.push(array.splice(0, chunkSize));
//   }
//   return result;
// }

// export function debounce<T extends any[]>(fn: (...args: T) => void, delay: number, immediate = false) {
//   let timeout: NodeJS.Timeout | undefined;

//   return function (...args: T) {
//     if (immediate && timeout == undefined) {
//       fn.apply(fn, args);
//     }

//     clearTimeout(timeout);

//     timeout = setTimeout(() => {
//       timeout = undefined;

//       if (!immediate) {
//         fn.apply(fn, args);
//       }
//     }, delay);
//   };
// }

// /**
//  * Invokes `func` after `delay` milliseconds. Any additional arguments are provided to `func` when it's invoked.
//  */
// export function delay<T extends any[]>(func: (...args: T) => void, delay: number, ...args: T) {
//   return setTimeout(() => func.apply(func, args), delay);
// }

// export function* getNextItem<T>(arr: T[]): Generator<T, undefined> {
//   for (let i = 0; i < arr.length; i++) {
//     yield arr[i];
//   }
//   return;
// }

// export function isArray(value: unknown): value is unknown[] {
//   return Array.isArray(value);
// }

// export function isBoolean(value: any): value is boolean {
//   return !isNil(value) && (typeof value === 'boolean' || value instanceof Boolean);
// }

// export function isDate(value: any): value is Date {
//   return _isDate(value);
// }

// export function isDefined<T extends any>(value: T): value is Exclude<T, undefined> {
//   return value !== undefined;
// }

// /**
//  * Checks if `value` is a  DOM element.
//  */
// export function isElement(value: any): value is HTMLElement {
//   return value instanceof HTMLElement;
// }

// export function isEmpty(value: unknown): value is undefined | null | false | 0 | never[] | '' | EmptyObject {
//   if (isNil(value)) return true;
//   if (value === false) return true;
//   if (value === 0) return true;
//   if ((isArray(value) || isString(value)) && value.length === 0) return true;
//   if (value instanceof Map && value.size === 0) return true;
//   if (value instanceof Set && value.size === 0) return true;
//   if (isPlainObject(value) && Object.keys(value as object).length === 0) return true;
//   return false;
// }

// export function isEven(value: number) {
//   return (value & 1) === 0;
// }

// export function isFunction(value: any): value is Function {
//   return !isNil(value) && typeof value === 'function';
// }

// export function isNil(value: any): value is null | undefined {
//   return value == undefined;
// }

// export function isNotNil<T extends any>(value: T): value is Exclude<T, null | undefined> {
//   return value != undefined;
// }

// export function isNotNull<T extends any>(value: T): value is Exclude<T, null> {
//   return value !== null;
// }

// export function isNull(value: any): value is null {
//   return value === null;
// }

// export function isNumber(value: any): value is number {
//   return !isNil(value) && (typeof value === 'number' || value instanceof Number);
// }

// export function isOdd(value: number) {
//   return (value & 1) === 1;
// }

// export function isPlainObject(value: unknown): value is Record<string, unknown> {
//   return !isNil(value) && typeof value === 'object' && (value as object).constructor.name === 'Object';
// }

// export function isString(value: any): value is string {
//   return !isNil(value) && (typeof value === 'string' || value instanceof String);
// }

// export function isSvgElement(value: any): value is SVGElement {
//   return value instanceof SVGElement;
// }

// export function isUndefined(value: any): value is undefined {
//   return value === undefined;
// }

// export function lastItem<T>(arr: T[], count = 1): T | undefined {
//   return arr[arr.length - count];
// }

// export function takeRight<T>(arr: T[], count = 1): T[] {
//   return arr.slice(Math.max(arr.length - count, 0));
// }

// /**
//  * Invokes `func` on next exeuction of the event loop. Any additional arguments are provided to `func` when it's invoked.
//  */
// export function nextTick<T extends any[]>(func: (...args: T) => void, ...args: T) {
//   return setTimeout(() => func.apply(func, args), 0);
// }

// export function throttle<T extends any[]>(fn: (...args: T) => void, delay: number, immediate = false) {
//   let timeout: NodeJS.Timeout | undefined;

//   return function (...args: T) {
//     if (timeout == undefined) {
//       if (immediate) {
//         fn.apply(fn, args);
//       }

//       timeout = setTimeout(() => {
//         timeout = undefined;

//         if (!immediate) {
//           fn.apply(fn, args);
//         }
//       }, delay);
//     }
//   };
// }

// // function throttle<T extends (...args: any[]) => any>(fn: T, delay: number, trailing = false) {
// //   let last: number | undefined = undefined;
// //   return function (...args: Parameters<T>): ReturnType<T> | void {
// //     const now = Date.now();

// //     if ((!trailing && !isDefined(last)) || (isDefined(last) && now - last > delay)) {
// //       last = now;
// //       return fn(...args);
// //     }
// //   };
// // }
