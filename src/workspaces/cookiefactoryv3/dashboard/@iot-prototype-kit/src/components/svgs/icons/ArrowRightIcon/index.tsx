// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { createClassName, type ComponentProps } from '@iot-prototype-kit/core/utils/element';

import baseStyles from '../styles.module.css';

export function ArrowRightIcon({ children, className, ...props }: ComponentProps) {
  return (
    <svg className={createClassName(baseStyles.svg, className)} viewBox="0 0 12 10" {...props}>
      <path d="M.167 5.833h8.476L5.899 8.577l1.178 1.179L11.833 5 7.077.244 5.899 1.423l2.744 2.743H.167v1.667Z" />
    </svg>
  );
}
