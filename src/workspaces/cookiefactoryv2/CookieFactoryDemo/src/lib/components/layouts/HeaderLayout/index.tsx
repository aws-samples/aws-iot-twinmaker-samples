// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { createClassName, type ClassName } from '@/lib/core/utils/element';
import { HierarchyNavigator, GlobalControls, Logo, SiteActivity, SiteSelector, UserMenu } from './components';

import styles from './styles.module.css';

export function HeaderLayout({ className }: { className?: ClassName }) {
  return (
    <main className={createClassName(styles.root, className)}>
      <section className={styles.head}>
        <Logo />
        <SiteSelector />
        <SiteActivity />
        <UserMenu />
        <EmptySlot />
      </section>
      <section className={styles.subhead}>
        <HierarchyNavigator />
        <GlobalControls />
      </section>
    </main>
  );
}

function EmptySlot() {
  return <span />;
}
