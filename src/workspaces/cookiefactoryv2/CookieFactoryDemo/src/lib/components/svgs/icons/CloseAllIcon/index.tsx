// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import { createClassName, type ClassName } from '@/lib/core/utils/element';

import baseStyles from '../styles.module.css';

// export function CloseAllIcon({ className }: { className?: ClassName }) {
//   return (
//     <svg className={createClassName(baseStyles.svg, className)} viewBox="0 0 600 600">
//       <path d="M0 133.333V600h466.667V133.333H0ZM66.667 200H400v333.333H66.667V200Zm222.902 53.863L233 310.433l-56.57-56.57-56.568 56.568L176.433 367l-56.57 56.569 56.568 56.568 56.57-56.57 56.568 56.57 56.568-56.568L289.57 367l56.568-56.569-56.568-56.568ZM133.333 0v100H200V66.667h333.333V400H500v66.667h100V0H133.333Z" />
//     </svg>
//   );
// }

export function CloseAllIcon({ className }: { className?: ClassName }) {
  return (
    <svg className={createClassName(baseStyles.svg, className)} viewBox="0 0 609 613">
      <path d="M358.667.667a250 250 0 0 1 250 250c0 72.179-30.588 137.213-79.508 182.847C534.933 410.801 538 387.008 538 362.5c0-7.264-.27-14.464-.799-21.593 13.728-27.107 21.466-57.77 21.466-90.24 0-110.457-89.543-200-200-200-34.85 0-67.617 8.913-96.147 24.584A284.222 284.222 0 0 0 250.5 75c-27.854 0-54.782 3.96-80.253 11.35C216.074 33.844 283.497.667 358.667.667Z" />
      <path d="M250.667 112.667a250 250 0 0 1 250 250c0 138.071-111.929 250-250 250s-250-111.929-250-250 111.929-250 250-250Zm0 50c-110.457 0-200 89.543-200 200s89.543 200 200 200 200-89.543 200-200-89.543-200-200-200Zm88.389 76.257 35.355 35.355-88.39 88.388 88.39 88.389-35.355 35.355-88.39-88.39-88.387 88.39-35.355-35.355 88.387-88.39-88.387-88.387 35.355-35.355 88.388 88.387 88.389-88.387Z" />
    </svg>
  );
}
