// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import { useEffect, useMemo } from 'react';

import { ArrowHeadDownIcon, AvatarIcon } from '@/lib/components/svgs/icons';
import { useMenu } from '@/lib/hooks';
import { useUserState } from '@/lib/state/user';
import { isNil } from '@/lib/utils/lang';
import { createClassName, type ClassName } from '@/lib/utils/element';

import menuStyles from '../menu.module.css';
import styles from './styles.module.css';

export function UserMenu({ className }: { className?: ClassName }) {
  const [user, setUser] = useUserState();
  const { handleTrigger, menu, menuContainerRef, selectedId } = useMenu([
    {
      component: () => (
        <div className={createClassName(menuStyles.menuItem)}>
          <span className={styles.menuItemName}>Switch roles</span>
        </div>
      ),
      id: crypto.randomUUID()
    }
  ]);

  const contentElement = useMemo(() => {
    return user ? (
      <>
        <section
          className={createClassName(styles.trigger, { [styles.triggerActive]: !isNil(menu) })}
          onPointerDown={handleTrigger}
        >
          <AvatarIcon className={styles.icon} />
          <section className={styles.group}>
            <div className={styles.name}>
              {user.firstName} {user.lastName}
            </div>
            <div className={styles.title}>{user.title}</div>
          </section>
          <ArrowHeadDownIcon className={styles.triggerIcon} />
        </section>
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
