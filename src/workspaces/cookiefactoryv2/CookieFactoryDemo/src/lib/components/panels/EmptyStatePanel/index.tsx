// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import type { ReactNode } from 'react';

import { createClassName, type ClassName } from '@/lib/core/utils/element';

import styles from './styles.module.css';

export function EmptyStatePanel({ children, className }: { children?: ReactNode; className?: ClassName }) {
  return <main className={createClassName(styles.root, className)}>{children}</main>;
}
