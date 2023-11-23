// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { createClassName, type ComponentProps } from '@iot-prototype-kit/core/utils/element';

import baseStyles from '../styles.module.css';

export function SuccessIcon({ children, className, ...props }: ComponentProps) {
  return (
    <svg className={createClassName(baseStyles.svg, className)} viewBox="0 0 34 34" {...props}>
      <path
        clipRule="evenodd"
        d="M17 .333C7.795.333.333 7.795.333 17c0 9.205 7.462 16.667 16.667 16.667 9.204 0 16.666-7.462 16.666-16.667C33.666 7.795 26.204.333 17 .333Zm0 30C9.648 30.333 3.666 24.352 3.666 17S9.648 3.667 17 3.667c7.352 0 13.333 5.981 13.333 13.333S24.352 30.333 17 30.333Zm6.276-19.288 2.357 2.357-10.3 10.343-6.178-6.178 2.356-2.357 3.822 3.821 7.943-7.986Z"
        fillRule="evenodd"
      />
    </svg>
  );
}
