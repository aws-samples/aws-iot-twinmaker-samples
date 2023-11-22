// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { createClassName, type ComponentProps } from '@iot-prototype-kit/core/utils/element';
import { getStatusBarConfig } from '@iot-prototype-kit/utils/config';

import styles from './styles.module.css';

export function StatusBar({ className }: ComponentProps) {
  const statusBarConfig = getStatusBarConfig();

  return <section className={createClassName(styles.root, className)}>{statusBarConfig}</section>;
}
