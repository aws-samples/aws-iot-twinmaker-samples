// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { useMemo, useState, type ReactNode } from 'react';

import { DropDownMenu } from '@iot-prototype-kit/core/components/DropDownMenu';
import { createClassName, type ClassName } from '@iot-prototype-kit/core/utils/element';
import { ArrowHeadDownIcon } from '@iot-prototype-kit/components/svgs/icons/ArrowHeadDownIcon';
import { GearIcon } from '@iot-prototype-kit/components/svgs/icons/GearIcon';

import menuStyles from '../common.module.css';
import styles from './styles.module.css';

export type ConfigurationMenuItems = Record<string, ReactNode>;

export function Configuration({ className, menuItems }: { className?: ClassName; menuItems: ConfigurationMenuItems }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string>();

  return useMemo(() => {
    const items = new Map<string, ReactNode>();

    Object.entries(menuItems).forEach(([key, element]) => {
      items.set(key, <MenuItem selected={key === selectedKey}>{element}</MenuItem>);
    });

    return (
      <DropDownMenu
        className={createClassName(styles.root, className)}
        menu={{
          className: createClassName(menuStyles.menu, styles.menu),
          items
        }}
        onOpen={(isOpen) => setIsOpen(isOpen)}
        onSelect={async (value) => setSelectedKey(value)}
        trigger={
          <main className={styles.trigger} data-active={isOpen}>
            <GearIcon className={styles.triggerIcon} />
            <ArrowHeadDownIcon className={styles.triggerArrow} />
          </main>
        }
      />
    );
  }, [isOpen, menuItems, selectedKey]);
}

function MenuItem({ children, selected }: { children: ReactNode; selected?: boolean }) {
  return (
    <main className={menuStyles.menuItem} data-selected={selected === true}>
      {children}
    </main>
  );
}
