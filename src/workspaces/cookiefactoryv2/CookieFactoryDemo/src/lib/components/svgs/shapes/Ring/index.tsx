// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import { createClassName, type ClassName } from '@/lib/core/utils/element';

import styles from '../styles.module.css';

export function Ring({ className }: { className?: ClassName }) {
  return (
    <svg className={createClassName(styles.svg, className)} viewBox="0 0 100 100">
      <path d="M50 0c27.614 0 50 22.386 50 50s-22.386 50-50 50S0 77.614 0 50 22.386 0 50 0Zm0 20c-16.569 0-30 13.431-30 30 0 16.569 13.431 30 30 30 16.569 0 30-13.431 30-30 0-16.569-13.431-30-30-30Z" />
    </svg>
  );
}
