// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { createClassName, type ComponentProps } from '@iot-prototype-kit/core/utils/element';

import baseStyles from '../styles.module.css';

export function FactoryIcon({ children, className, ...props }: ComponentProps) {
  return (
    <svg className={createClassName(baseStyles.svg, className)} viewBox="0 0 24 24" {...props}>
      <path d="M22 1h-4a1 1 0 0 0-1 1v7h-2V7a1 1 0 0 0-1.447-.895L9 8.382V7a1 1 0 0 0-1.447-.895l-6 3A1 1 0 0 0 1 10v12a1 1 0 0 0 1 1h20a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1Zm-1 2v2h-2V3ZM3 21V10.618l4-2V10a1 1 0 0 0 1.447.895L13 8.618V10a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V7h2v14Zm2-8h3v2H5Zm5 0h4v2h-4Zm6 0h3v2h-3ZM5 17h3v2H5Zm5 0h4v2h-4Zm6 0h3v2h-3Z" />
    </svg>
  );
}
