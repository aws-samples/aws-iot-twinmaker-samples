// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { FactoryIcon } from '@/lib/components/svgs/icons';
import { createClassName, type ClassName } from '@/lib/core/utils/element';
import { getSites } from '@/lib/init/sites';
import { siteStore } from '@/lib/stores/site';
import type { Site } from '@/lib/types';

import styles from './styles.module.css';

export function SiteSelectorView({ className }: { className?: ClassName }) {
  const siteElements = getSites().map((site) => {
    return <SiteElement key={site.id} handlePointerUp={() => siteStore.setState(site)} site={site} />;
  });

  return (
    <main className={createClassName(styles.root, className, {})}>
      <section className={styles.head}>Choose a site</section>
      <section className={styles.sites}>{siteElements}</section>
    </main>
  );
}

function SiteElement({ handlePointerUp, site }: { handlePointerUp: (site: Site) => void; site: Site }) {
  return (
    <button className={styles.site} onPointerUp={() => handlePointerUp(site)}>
      <section className={styles.siteIcon}>
        <FactoryIcon />
      </section>
      <section className={styles.siteGroup}>
        <section className={styles.siteName}>{site.name}</section>
      </section>
    </button>
  );
}
