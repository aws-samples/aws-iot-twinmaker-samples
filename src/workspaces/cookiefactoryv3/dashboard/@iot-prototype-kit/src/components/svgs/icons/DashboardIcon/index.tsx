// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { createClassName, type ComponentProps } from '@iot-prototype-kit/core/utils/element';

import baseStyles from '../styles.module.css';
import styles from './styles.module.css';

export function DashboardIcon({ children, className, ...props }: ComponentProps) {
  return (
    <svg className={createClassName(baseStyles.svg, className)} viewBox="0 0 600 511" {...props}>
      <g transform="translate(126)">
        <line className={styles.line} x1="296" x2="414" y1="251" y2="60" />
        <line className={styles.line} x1="50" x2="173" y1="312" y2="121" />
        <line className={styles.line} x1="296" x2="173" y1="251" y2="121" />
        <circle cx="296" cy="251" r="60" />
        <circle cx="50" cy="312" r="60" />
        <circle cx="173" cy="121" r="60" />
        <circle cx="414" cy="60" r="60" />
      </g>
      <rect width="70" height="419" y="68" />
      <rect width="90" height="600" x="255" y="166" transform="rotate(90 300 466)" />
    </svg>
  );
}
