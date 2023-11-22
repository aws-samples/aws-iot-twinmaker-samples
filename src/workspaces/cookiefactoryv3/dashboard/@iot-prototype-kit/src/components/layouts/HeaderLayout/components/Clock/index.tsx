// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { format } from 'date-fns';

import { useStore } from '@iot-prototype-kit/core/store';
import { createClassName, type ComponentProps } from '@iot-prototype-kit/core/utils/element';
import { $now } from '@iot-prototype-kit/stores/time';

import styles from './styles.module.css';

export function Clock({ children, className, ...props }: ComponentProps) {
  const now = useStore($now);

  return (
    <main className={createClassName(styles.root, className)} {...props}>
      <span data-date> {format(now, 'LLL d')}</span>
      <span data-time>{format(now, 'h:mm aaa')}</span>
    </main>
  );
}
