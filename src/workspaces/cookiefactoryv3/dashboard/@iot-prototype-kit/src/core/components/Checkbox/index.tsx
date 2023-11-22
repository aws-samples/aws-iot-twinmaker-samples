// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { createClassName, type ComponentProps } from '@iot-prototype-kit/core/utils/element';

import styles from './styles.module.css';

export function Checkbox({ className, isIndeterminate }: ComponentProps<{ isIndeterminate: boolean }>) {
  return (
    <main className={createClassName(styles.checkbox, className)}>
      <svg viewBox="0 0 18 18" aria-hidden="true">
        {isIndeterminate ? <rect x={1} y={7.5} width={15} height={3} /> : <polyline points="1 9 7 14 15 4" />}
      </svg>
    </main>
  );
}
