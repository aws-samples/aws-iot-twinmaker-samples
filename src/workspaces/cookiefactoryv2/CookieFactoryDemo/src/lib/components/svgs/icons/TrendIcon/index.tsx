// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import { createClassName, type ClassName } from '@/lib/core/utils/element';

import baseStyles from '../styles.module.css';
import styles from './styles.module.css';

export function TrendIcon({ className }: { className?: ClassName }) {
  return (
    <svg className={createClassName(baseStyles.svg, className)} viewBox="0 0 44 44">
      <circle className={styles.circle} cx="22" cy="22" r="20" transform="rotate(-90 22 22)" />
      <path d="M11 23.54h15.984l-5.175 5.175 2.222 2.222L33 21.968 24.031 13l-2.222 2.222 5.175 5.175H11v3.143Z" />
    </svg>
  );
}
