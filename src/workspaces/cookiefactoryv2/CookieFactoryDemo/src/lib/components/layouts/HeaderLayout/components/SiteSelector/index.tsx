// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useMemo } from 'react';

import { ArrowHeadDownIcon } from '@/lib/components/svgs/icons';
import { Circle, Ring } from '@/lib/components/svgs/shapes';
import { useMenu } from '@/lib/core/hooks';
import { createClassName, type ClassName } from '@/lib/core/utils/element';
import { isNil } from '@/lib/core/utils/lang';
import { getSites } from '@/lib/init/sites';
import { useSiteStore } from '@/lib/stores/site';
import type { AlarmState } from '@/lib/types';

import menuStyles from '../menu.module.css';
import styles from './styles.module.css';

export function SiteSelector({ className }: { className?: ClassName }) {
  const [siteState, setSiteState] = useSiteStore();

  const { handleTrigger, menu, menuContainerRef, selectedId } = useMenu(
    getSites().map(({ health, id, name, location }) => {
      return {
        component: ({ selected }) => (
          <main className={createClassName(menuStyles.menuItem, styles.menuItem)} data-selected={selected === true}>
            {getHealthIcon(health, styles.menuItemIcon)}
            <section className={styles.menuItemLabel}>
              <div className={styles.menuItemLabelName}>{name}</div>
              <div className={styles.menuItemLabelLocation}>{location}</div>
            </section>
          </main>
        ),
        id
      };
    }),
    { className: createClassName(menuStyles.menu, styles.menu), selectedId: siteState?.id }
  );

  const contentElement = useMemo(() => {
    return siteState ? (
      <>
        <button className={styles.trigger} data-active={!isNil(menu)} onPointerUp={handleTrigger}>
          {getHealthIcon(siteState.health, styles.triggerIcon)}
          <section className={styles.triggerName}>{siteState.name}</section>
          <ArrowHeadDownIcon className={styles.triggerArrow} />
        </button>
        {menu}
      </>
    ) : null;
  }, [siteState, menu]);

  useEffect(() => {
    if (selectedId) setSiteState(getSites().find((site) => site.id === selectedId) ?? null);
  }, [selectedId]);

  return (
    <section ref={menuContainerRef} className={createClassName(styles.root, className)}>
      {contentElement}
    </section>
  );
}

function getHealthIcon(health: AlarmState, className: ClassName) {
  switch (health) {
    case 'High':
    case 'Medium':
    case 'Low':
    case 'Normal':
      return <Circle className={createClassName(className, styles[`health${health}`])} />;
    default:
      return <Ring className={createClassName(className, styles[`health${health}`])} />;
  }
}
