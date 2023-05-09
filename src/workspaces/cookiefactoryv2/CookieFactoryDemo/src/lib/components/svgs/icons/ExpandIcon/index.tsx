// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import { createClassName, type ClassName } from '@/lib/core/utils/element';

import baseStyles from '../styles.module.css';

export function ExpandIcon({ className }: { className?: ClassName }) {
  return (
    <svg className={createClassName(baseStyles.svg, className)} viewBox="0 0 15 15">
      <path d="M15 0v5.833h-1.667V2.856L9.328 6.85 8.15 5.672l4.015-4.005H9.167V0H15ZM5.684 8.173 6.863 9.35l-4.011 3.982h2.981V15H0V9.167h1.667v2.994l4.017-3.988Z" />
    </svg>
  );
}
