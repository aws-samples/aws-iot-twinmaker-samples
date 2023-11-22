// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { createClassName, type ClassName } from '@iot-prototype-kit/core/utils/element';
import { CookieFactoryLogoWide } from '@/lib/components/svgs/logos/CookieFactoryLogo';

import styles from './styles.module.css';

export function EmptyStatePanel({ className }: { className?: ClassName }) {
  return (
    <main className={createClassName(styles.root, className)}>
      <CookieFactoryLogoWide className={styles.emptyStateLogo} />
    </main>
  );
}
