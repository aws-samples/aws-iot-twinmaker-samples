// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import { createClassName, type ClassName } from '@/lib/core/utils/element';

import baseStyles from '../styles.module.css';
import styles from './styles.module.css';

export function CameraIcon({ className }: { className?: ClassName }) {
  return (
    <svg className={createClassName(baseStyles.svg, styles.svg, className)} viewBox="0 0 701 451">
      <path d="M38 38h375v375H38zM438 163 663 38v375L438 288" />
    </svg>
  );
}
