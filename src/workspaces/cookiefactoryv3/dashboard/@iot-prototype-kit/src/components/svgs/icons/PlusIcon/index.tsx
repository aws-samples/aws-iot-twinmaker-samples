// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { createClassName, type ComponentProps } from '@iot-prototype-kit/core/utils/element';

import baseStyles from '../styles.module.css';

export function PlusIcon({ children, className, ...props }: ComponentProps) {
  return (
    <svg className={createClassName(baseStyles.svg, className)} viewBox="0 0 100 100" {...props}>
      <polygon points="55.5555555 0 55.5554688 44.4442708 100 44.4444445 100 55.5555555 55.5554688 55.5554688 55.5555555 100 44.4444445 100 44.4442708 55.5554688 0 55.5555555 0 44.4444445 44.4442708 44.4442708 44.4444445 0" />
    </svg>
  );
}
