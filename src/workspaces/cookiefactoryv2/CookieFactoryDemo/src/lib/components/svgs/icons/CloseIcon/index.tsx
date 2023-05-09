// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import { createClassName, type ClassName } from '@/lib/core/utils/element';

import baseStyles from '../styles.module.css';

export function CloseIcon({ className }: { className?: ClassName }) {
  return (
    <svg className={createClassName(baseStyles.svg, className)} viewBox="0 0 30 30">
      <path d="M15.666.667a15 15 0 0 1 15 15c0 8.284-6.715 15-15 15-8.284 0-15-6.716-15-15 0-8.285 6.716-15 15-15Zm0 3c-6.627 0-12 5.372-12 12 0 6.627 5.373 12 12 12 6.628 0 12-5.373 12-12 0-6.628-5.372-12-12-12Zm5.304 4.575 2.121 2.121-5.303 5.304 5.303 5.303-2.121 2.121-5.303-5.303-5.304 5.303-2.121-2.121 5.303-5.303-5.303-5.304 2.121-2.12 5.303 5.302 5.304-5.303Z" />
    </svg>
  );
}
