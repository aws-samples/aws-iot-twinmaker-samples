// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import type { ReactNode } from 'react';

import { BodyLayout, HeaderLayout } from '@/lib/components/layouts';
import { createClassName, type ClassName } from '@/lib/core/utils/element';

import styles from './styles.module.css';

export function AppLayout({ className, children }: { className?: ClassName; children?: ReactNode }) {
  return (
    <main className={createClassName(styles.root, className)}>
      <HeaderLayout />
      <BodyLayout>{children}</BodyLayout>
    </main>
  );
}
