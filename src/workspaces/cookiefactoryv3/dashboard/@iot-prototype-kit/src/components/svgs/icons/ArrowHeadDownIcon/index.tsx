// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { createClassName, type ComponentProps } from '@iot-prototype-kit/core/utils/element';

import baseStyles from '../styles.module.css';

export function ArrowHeadDownIcon({ children, className, ...props }: ComponentProps) {
  return (
    <svg className={createClassName(baseStyles.svg, className)} viewBox="0 0 16 10" {...props}>
      <path d="M8 9.887.862 2.762 2.637.987 8 6.362 13.362.987l1.775 1.775L8 9.887Z" />
    </svg>
  );
}
