// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

export function compareStrings(a: string, b: string, order: 'ASC' | 'DESC' = 'ASC') {
  const value = a.localeCompare(b, 'en', { numeric: true });
  return value * (order === 'ASC' ? 1 : -1);
}

export function upperFirst(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
