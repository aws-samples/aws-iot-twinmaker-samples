// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import { createClassName, type ClassName } from '@/lib/utils/element';

import baseStyles from '../styles.module.css';

export function CloseAllIcon({ className }: { className?: ClassName }) {
  return (
    <svg className={createClassName(baseStyles.svg, className)} viewBox="0 0 600 600">
      <path d="M0 133.333V600h466.667V133.333H0ZM66.667 200H400v333.333H66.667V200Zm222.902 53.863L233 310.433l-56.57-56.57-56.568 56.568L176.433 367l-56.57 56.569 56.568 56.568 56.57-56.57 56.568 56.57 56.568-56.568L289.57 367l56.568-56.569-56.568-56.568ZM133.333 0v100H200V66.667h333.333V400H500v66.667h100V0H133.333Z" />
    </svg>
  );
}
