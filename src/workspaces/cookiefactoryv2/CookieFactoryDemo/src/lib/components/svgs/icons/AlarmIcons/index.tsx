// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import type { CSSProperties } from 'react';

import { createClassName, type ClassName } from '@/lib/core/utils/element';

import baseStyles from '../styles.module.css';

export function AlarmHighIcon({ className, style }: { className?: ClassName; style?: CSSProperties }) {
  return (
    <svg className={createClassName(baseStyles.svg, className)} style={style} viewBox="0 0 22 22">
      <path
        d="M11 .167c5.973 0 10.834 4.86 10.834 10.833 0 5.972-4.861 10.833-10.834 10.833C5.028 21.833.167 16.973.167 11 .167 5.028 5.027.167 11 .167Zm0 2.166A8.654 8.654 0 0 0 2.334 11 8.654 8.654 0 0 0 11 19.667 8.654 8.654 0 0 0 19.667 11 8.654 8.654 0 0 0 11 2.333Zm0 11.648c.774 0 1.354.572 1.354 1.352 0 .78-.58 1.352-1.354 1.352-.791 0-1.354-.572-1.354-1.369 0-.763.58-1.335 1.354-1.335ZM12.084 4.5v7.583H9.917V4.5h2.167Z"
        clipRule="evenodd"
        fillRule="evenodd"
      />
    </svg>
  );
}

export function AlarmMediumIcon({ className, style }: { className?: ClassName; style?: CSSProperties }) {
  return (
    <svg className={createClassName(baseStyles.svg, className)} style={style} viewBox="0 0 24 24">
      <path
        d="m13.532 1.288 9.18 9.18a2.167 2.167 0 0 1 0 3.064l-9.18 9.18a2.167 2.167 0 0 1-3.064 0l-9.18-9.18a2.167 2.167 0 0 1 0-3.064l9.18-9.18a2.167 2.167 0 0 1 3.064 0ZM12 2.82 2.82 12 12 21.18 21.18 12 12 2.82Zm0 12.16c.774 0 1.354.571 1.354 1.351s-.58 1.352-1.354 1.352c-.791 0-1.354-.572-1.354-1.37 0-.762.58-1.334 1.354-1.334Zm1.084-8.397v6.5h-2.167v-6.5h2.167Z"
        clipRule="evenodd"
        fillRule="evenodd"
      />
    </svg>
  );
}

export function AlarmLowIcon({ className, style }: { className?: ClassName; style?: CSSProperties }) {
  return (
    <svg className={createClassName(baseStyles.svg, className)} style={style} viewBox="0 0 22 19">
      <path
        d="M12.046.264a2 2 0 0 1 .744.744l8.554 14.969a2 2 0 0 1-1.737 2.992H2.5a2 2 0 0 1-1.736-2.992L9.317 1.008a2 2 0 0 1 2.729-.744ZM11.054 2 2.5 16.97h17.107L11.054 2ZM11 12.75c.714 0 1.25.528 1.25 1.248s-.536 1.248-1.25 1.248c-.73 0-1.25-.528-1.25-1.264 0-.704.536-1.232 1.25-1.232ZM12 5v6h-2V5h2Z"
        clipRule="evenodd"
        fillRule="evenodd"
      />
    </svg>
  );
}
