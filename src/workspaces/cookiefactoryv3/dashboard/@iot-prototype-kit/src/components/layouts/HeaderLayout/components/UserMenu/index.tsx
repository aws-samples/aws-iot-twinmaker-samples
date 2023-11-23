// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { type ReactNode } from 'react';

import { DropDownMenu } from '@iot-prototype-kit/core/components/DropDownMenu';
import { ArrowHeadDownIcon } from '@iot-prototype-kit/components/svgs/icons/ArrowHeadDownIcon';
import { AvatarIcon } from '@iot-prototype-kit/components/svgs/icons/AvatarIcon';
import { useStore } from '@iot-prototype-kit/core/store';
import { createClassName, type ComponentProps } from '@iot-prototype-kit/core/utils/element';
import { isNil } from '@iot-prototype-kit/core/utils/lang2';
import { $user, resetUser } from '@iot-prototype-kit/stores/user';
import { authenticateUser, getUserFullName } from '@iot-prototype-kit/utils/user';
import { getUserConfigs } from '@iot-prototype-kit/utils/config';

import common from '../common.module.css';
import styles from './styles.module.css';

export function UserMenu({ children, className, ...props }: ComponentProps) {
  const user = useStore($user);
  const userConfigs = getUserConfigs();

  if (isNil(user)) return null;

  const items: Record<string, ReactNode> = {};

  userConfigs.forEach((userConfig) => {
    items[userConfig.email] = (
      <UserMenuItem label={getUserFullName(user)} selected={userConfig.email === user?.email} />
    );
  });

  items['-'] = <UserMenuItem label="Sign out" />;

  return (
    <DropDownMenu
      className={createClassName(common.menu, styles.menu, className)}
      items={items}
      onSelect={async (value) => {
        const userConfig = userConfigs.find(({ email }) => email === value) ?? null;

        if (userConfig) {
          $user.set(await authenticateUser(userConfig));
        } else {
          resetUser();
        }
      }}
      selectedKey={user?.email}
      {...props}
    >
      <main data-trigger>
        <AvatarIcon data-trigger-avatar />
        <section data-trigger-group>
          <div data-trigger-name>{getUserFullName(user)}</div>
          <div data-trigger-title>{user.title}</div>
        </section>
        <ArrowHeadDownIcon data-trigger-arrow />
      </main>
    </DropDownMenu>
  );
}

function UserMenuItem({ label, selected }: { label: string; selected?: boolean }) {
  return (
    <main data-menu-item data-selected={selected === true}>
      {label}
    </main>
  );
}
