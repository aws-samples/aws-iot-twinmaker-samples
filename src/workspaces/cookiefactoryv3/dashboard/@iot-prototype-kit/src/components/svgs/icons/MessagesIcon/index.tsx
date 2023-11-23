// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { createClassName, type ComponentProps } from '@iot-prototype-kit/core/utils/element';

import baseStyles from '../styles.module.css';

/**
 * Vectors and icons by <a href="https://github.com/siemens/ix-icons?ref=svgrepo.com" target="_blank">Siemens</a>
 * in MIT License via <a href="https://www.svgrepo.com/" target="_blank">SVG Repo</a>
 */

export function MessagesIcon({ children, className, ...props }: ComponentProps) {
  return (
    <svg className={createClassName(baseStyles.svg, className)} viewBox="0 0 21 21" {...props}>
      <path d="M4.583 4.583V16.5h5.139l7.861 4.333-.002-4.333h3.252V4.583H4.583ZM18.667 6.75v7.583h-3.252v2.829l-5.136-2.829H6.75V6.75h11.917Zm-3.25-6.5v2.167h-13v8.666H.25V.25h15.167Z" />
    </svg>
  );
}
