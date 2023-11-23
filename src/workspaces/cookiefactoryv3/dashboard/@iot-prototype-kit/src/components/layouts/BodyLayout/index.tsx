// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { createClassName, type ComponentProps } from '@iot-prototype-kit/core/utils/element';

import styles from './styles.module.css';

export function BodyLayout({ children, className }: ComponentProps) {
  return (
    <main className={createClassName(styles.root, className)} data-body-layout>
      {children}
    </main>
  );
}
