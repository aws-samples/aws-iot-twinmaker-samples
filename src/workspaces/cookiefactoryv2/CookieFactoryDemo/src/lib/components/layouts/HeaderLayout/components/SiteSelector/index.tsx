// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useMemo } from 'react';

import { ArrowHeadDownIcon } from '@/lib/components/svgs/icons';
import { Circle, Ring } from '@/lib/components/svgs/shapes';
import { useMenu } from '@/lib/core/hooks';
import { createClassName, type ClassName } from '@/lib/core/utils/element';
import { isNil } from '@/lib/core/utils/lang';
import { SITES } from '@/lib/init/sites';
import { useSiteStore } from '@/lib/stores/site';
import type { AlarmState } from '@/lib/types';

import menuStyles from '../menu.module.css';
import styles from './styles.module.css';

export function SiteSelector({ className }: { className?: ClassName }) {
  const [siteState, setSiteState] = useSiteStore();

  const { handleTrigger, menu, menuContainerRef, selectedId } = useMenu(
    SITES.map(({ health, id, name, location }) => {
      return {
        component: ({ selected }) => (
          <div className={createClassName(menuStyles.menuItem)}>
            {getHealthIcon(
              health,
              createClassName(styles.menuItemIcon, {
                [styles.menuItemIconSelected]: selected === true
              })
            )}

            <div className={styles.menuItemLabel}>
              <div className={styles.menuItemName}>{name}</div>
              <div className={styles.menuItemLocation}>{location}</div>
            </div>
          </div>
        ),
        id
      };
    }),
    { selectedId: siteState?.id }
  );

  const contentElement = useMemo(() => {
    return siteState ? (
      <>
        <section
          className={createClassName(styles.trigger, { [styles.triggerActive]: !isNil(menu) })}
          onPointerUp={handleTrigger}
        >
          {getHealthIcon(siteState.health, styles.healthIcon)}
          <span className={styles.name}>{siteState.name}</span>
          <ArrowHeadDownIcon className={styles.triggerIcon} />
        </section>
        {menu}
      </>
    ) : null;
  }, [siteState, menu]);

  useEffect(() => {
    if (selectedId) setSiteState(SITES.find((site) => site.id === selectedId) ?? null);
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
