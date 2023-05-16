// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { GearIcon } from '@/lib/components/svgs/icons';
import { createClassName, type ClassName } from '@/lib/core/utils/element';

import styles from './styles.module.css';

export function Configuration({ className }: { className?: ClassName }) {
  return (
    <section className={createClassName(styles.root, className)}>
      <GearIcon className={styles.icon} />
    </section>
  );
}
