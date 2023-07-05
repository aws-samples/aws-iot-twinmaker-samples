// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { FactoryIcon } from '@/lib/components/svgs/icons';
import { CookieFactoryLogoWide } from '@/lib/components/svgs/logos';
import { createClassName, type ClassName } from '@/lib/core/utils/element';
import { getSites } from '@/lib/init/sites';
import { siteStore } from '@/lib/stores/site';
import type { Site } from '@/lib/types';

import styles from './styles.module.css';

const HEAD_LABEL = `Choose a location`;

export function SiteSelectorView({ className }: { className?: ClassName }) {
  const siteElements = getSites().map((site) => {
    return <SiteElement key={site.id} handlePointerUp={() => siteStore.setState(site)} site={site} />;
  });

  return (
    <main className={createClassName(styles.root, className, {})}>
      <CookieFactoryLogoWide className={styles.logo} />
      <section className={styles.head}>{HEAD_LABEL}</section>
      <section className={styles.items}>{siteElements}</section>
    </main>
  );
}

function SiteElement({ handlePointerUp, site }: { handlePointerUp: (site: Site) => void; site: Site }) {
  return (
    <button className={styles.item} onPointerUp={() => handlePointerUp(site)}>
      <FactoryIcon className={styles.itemIcon} />
      <section className={styles.itemGroup}>
        <section className={styles.itemName}>{site.name}</section>
      </section>
    </button>
  );
}
