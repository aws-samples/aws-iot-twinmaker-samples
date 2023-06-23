// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useMemo } from 'react';

import { ArrowHeadDownIcon, AvatarIcon } from '@/lib/components/svgs/icons';
import { useMenu } from '@/lib/core/hooks';
import { createClassName, type ClassName } from '@/lib/core/utils/element';
import { isNil } from '@/lib/core/utils/lang';
import { useUserStore } from '@/lib/stores/user';
``;
import menuStyles from '../menu.module.css';
import styles from './styles.module.css';

export function UserMenu({ className }: { className?: ClassName }) {
  const [user, setUser] = useUserStore();
  const { handleTrigger, menu, menuContainerRef, selectedId } = useMenu(
    [
      {
        component: ({ selected }) => (
          <main className={menuStyles.menuItem} data-selected={selected === true}>
            <section className={styles.menuItemLabel}>Switch roles</section>
          </main>
        ),
        id: crypto.randomUUID()
      }
    ],
    { className: createClassName(menuStyles.menu, styles.menu) }
  );

  const contentElement = useMemo(() => {
    return user ? (
      <>
        <button className={styles.trigger} data-active={!isNil(menu)} onPointerUp={handleTrigger}>
          <AvatarIcon className={styles.triggerAvatar} />
          <section className={styles.triggerGroup}>
            <div className={styles.triggerName}>
              {user.firstName} {user.lastName}
            </div>
            <div className={styles.triggerTitle}>{user.title}</div>
          </section>
          <ArrowHeadDownIcon className={styles.triggerArrow} />
        </button>
        {menu}
      </>
    ) : null;
  }, [user, menu]);

  useEffect(() => {
    if (selectedId) setUser(null);
  }, [selectedId]);

  return (
    <section ref={menuContainerRef} className={createClassName(styles.root, className)}>
      {contentElement}
    </section>
  );
}
