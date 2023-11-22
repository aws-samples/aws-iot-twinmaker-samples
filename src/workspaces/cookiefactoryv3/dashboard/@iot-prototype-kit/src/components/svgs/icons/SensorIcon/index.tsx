// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { createClassName, type ComponentProps } from '@iot-prototype-kit/core/utils/element';

import baseStyles from '../styles.module.css';
import styles from './styles.module.css';

export function SensorIcon({ children, className, ...props }: ComponentProps) {
  return (
    <svg className={createClassName(baseStyles.svg, styles.svg, className)} viewBox="0 0 24 24" {...props}>
      <path d="M8.464 15.536a5 5 0 0 1 0-7.072m-2.828 9.9a9 9 0 0 1 0-12.728m9.9 9.9a5 5 0 0 0 0-7.072m2.828 9.9a9 9 0 0 0 0-12.728M13 12a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
    </svg>
  );
}
