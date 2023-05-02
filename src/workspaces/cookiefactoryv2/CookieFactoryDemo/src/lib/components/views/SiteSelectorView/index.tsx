// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import { FactoryIcon } from '@/lib/components/svgs/icons';
import { SITES } from '@/lib/sites';
import { useSiteState } from '@/lib/state/site';
import { createClassName, type ClassName } from '@/lib/utils/element';
import type { Site } from '@/lib/types';

import styles from './styles.module.css';

export function SiteSelectorView({ className }: { className?: ClassName }) {
  const [,setSiteState] = useSiteState();

  const siteElements = SITES.map((site) => {
    return <SiteElement key={site.id} handlePointerDown={() => setSiteState(site)} site={site} />;
  });

  return (
    <main className={createClassName(styles.root, className, {})}>
      <section className={styles.head}>Choose a site</section>
      <section className={styles.sites}>{siteElements}</section>
    </main>
  );
}

function SiteElement({ handlePointerDown, site }: { handlePointerDown: (site: Site) => void; site: Site }) {
  return (
    <button className={styles.site} onPointerDown={() => handlePointerDown(site)}>
      <section className={styles.siteIcon}>
        <FactoryIcon />
      </section>
      <section className={styles.siteGroup}>
        <section className={styles.siteName}>{site.name}</section>
      </section>
    </button>
  );
}
