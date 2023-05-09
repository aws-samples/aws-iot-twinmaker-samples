// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import { createClassName, type ClassName } from '@/lib/core/utils/element';

import baseStyles from '../styles.module.css';

export function MinusIcon({ className }: { className?: ClassName }) {
  return (
    <svg className={createClassName(baseStyles.svg, className)} viewBox="0 0 100 16">
      <rect width="100" height="16" />
    </svg>
  );
}
