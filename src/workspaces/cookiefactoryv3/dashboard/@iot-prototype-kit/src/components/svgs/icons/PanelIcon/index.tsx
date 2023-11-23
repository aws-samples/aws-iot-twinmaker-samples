// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { createClassName, type ComponentProps } from '@iot-prototype-kit/core/utils/element';

import baseStyles from '../styles.module.css';

export function PanelIcon({ children, className, ...props }: ComponentProps) {
  return (
    <svg className={createClassName(baseStyles.svg, className)} viewBox="0 0 20 20" {...props}>
      <path d="M0 0h8v8H0zM11.999 0h8v8h-8zM0 12h8v8H0zM11.999 12h8v8h-8z" />
    </svg>
  );
}
