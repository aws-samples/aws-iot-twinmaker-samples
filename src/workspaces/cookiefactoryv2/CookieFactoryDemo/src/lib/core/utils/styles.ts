// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

export function injectCssVars(vars: Record<string, string>, prefix = '') {
  const head = document.getElementsByTagName('head');
  const style = document.createElement('style');
  let innerHTML = ':root {';
  Object.entries(vars).forEach(([key, value]) => {
    innerHTML += `--${prefix}${key.toLowerCase()}: ${value};`;
  });
  innerHTML += '}';
  style.innerHTML = innerHTML;
  head[0].appendChild(style);
}
