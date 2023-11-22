// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { createClassName, type ComponentProps } from '@iot-prototype-kit/core/utils/element';

import baseStyles from '../styles.module.css';

export function AvatarIcon({ children, className, ...props }: ComponentProps) {
  return (
    <svg className={createClassName(baseStyles.svg, className)} viewBox="0 0 30 30" {...props}>
      <path d="M20.682 11.307a5.625 5.625 0 1 1-11.25 0 5.625 5.625 0 0 1 11.25 0Z" />
      <path d="M15 0C6.716 0 0 6.716 0 15c0 8.284 6.716 15 15 15 8.284 0 15-6.716 15-15 0-8.284-6.716-15-15-15ZM3.172 9.312a13.125 13.125 0 1 1 22.08 13.882C23.92 21.047 20.991 18.75 15 18.75c-5.99 0-8.921 2.299-10.253 4.444A13.125 13.125 0 0 1 3.172 9.312Z" />
    </svg>
  );
}
