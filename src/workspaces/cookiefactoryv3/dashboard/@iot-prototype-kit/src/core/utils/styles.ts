// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

const ELEMENT_TAG = 'custom-vars';

export function injectCssVars(vars: Record<string, string>, prefix = '') {
  requestAnimationFrame(() => {
    const head = document.getElementsByTagName('head');
    const style = getStyleElement();

    let innerHTML = ':root {';
    Object.entries(vars).forEach(([key, value]) => {
      innerHTML += `--${prefix}${key}: ${value};`;
    });
    innerHTML += '}';

    style.innerHTML = innerHTML;
    head[0].appendChild(style);
  });
}

function getStyleElement() {
  let style: HTMLStyleElement | undefined = undefined;

  for (const el of document.getElementsByTagName('style')) {
    if (el.attributes.getNamedItem(ELEMENT_TAG)) {
      style = el;
      break;
    }
  }

  if (style === undefined) {
    style = document.createElement('style');
    style.setAttribute(ELEMENT_TAG, '');
  }

  return style;
}
