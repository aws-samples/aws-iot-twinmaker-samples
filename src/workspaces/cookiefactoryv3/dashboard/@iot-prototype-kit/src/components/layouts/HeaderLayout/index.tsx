// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { createClassName, type ComponentProps } from '@iot-prototype-kit/core/utils/element';

import './styles.css';

export function HeaderLayout({ children, className, ...props }: ComponentProps) {
  return (
    <main className={createClassName(className)} data-header {...props}>
      {children}
    </main>
  );
}
