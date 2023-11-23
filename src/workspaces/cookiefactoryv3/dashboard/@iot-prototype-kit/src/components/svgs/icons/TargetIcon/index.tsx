// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { createClassName, type ComponentProps } from '@iot-prototype-kit/core/utils/element';

import baseStyles from '../styles.module.css';

export function TargetIcon({ children, className, ...props }: ComponentProps) {
  return (
    <svg className={createClassName(baseStyles.svg, className)} viewBox="0 0 100 100" {...props}>
      <path d="M50 31.818c-10.045 0-18.182 8.137-18.182 18.182 0 10.045 8.137 18.182 18.182 18.182 10.045 0 18.182-8.137 18.182-18.182 0-10.045-8.137-18.182-18.182-18.182Zm40.636 13.637c-2.09-18.955-17.136-34-36.09-36.091V0h-9.091v9.364c-18.955 2.09-34 17.136-36.091 36.09H0v9.091h9.364c2.09 18.955 17.136 34 36.09 36.091V100h9.091v-9.364c18.955-2.09 34-17.136 36.091-36.09H100v-9.091h-9.364ZM50 81.818c-17.59 0-31.818-14.227-31.818-31.818 0-17.59 14.227-31.818 31.818-31.818 17.59 0 31.818 14.227 31.818 31.818 0 17.59-14.227 31.818-31.818 31.818Z" />
    </svg>
  );
}

export function TargetIcon2({ children, className, ...props }: ComponentProps) {
  return (
    <svg className={createClassName(baseStyles.svg, className)} viewBox="0 0 20 20" {...props}>
      {/* <path d="M10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" /> */}
      <path
        clipRule="evenodd"
        d="M10 20c5.523 0 10-4.477 10-10S15.523 0 10 0 0 4.477 0 10s4.477 10 10 10Zm6-10a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z"
        fillRule="evenodd"
      />
    </svg>
  );
}
