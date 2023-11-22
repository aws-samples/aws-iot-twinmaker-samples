// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { createClassName, type ComponentProps } from '@iot-prototype-kit/core/utils/element';

import baseStyles from '../styles.module.css';

export function ListIcon({ children, className, ...props }: ComponentProps) {
  return (
    <svg className={createClassName(baseStyles.svg, className)} viewBox="0 0 23 17" {...props}>
      <path d="M6.5 1.3h16v1.3h-16zM0 0h3.9v3.9H0zM6.5 7.8h16v1.3h-16zM0 6.5h3.9v3.9H0zM6.5 14.3h16v1.3h-16zM0 13h3.9v3.9H0z" />
    </svg>
  );
}
