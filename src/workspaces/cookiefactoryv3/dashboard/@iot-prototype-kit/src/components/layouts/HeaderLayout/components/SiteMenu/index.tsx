// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import type { ReactNode } from 'react';

import { ArrowHeadDownIcon } from '@iot-prototype-kit/components/svgs/icons/ArrowHeadDownIcon';
import { DropDownMenu } from '@iot-prototype-kit/core/components/DropDownMenu';
import { useStore } from '@iot-prototype-kit/core/store';
import { createClassName, type ComponentProps } from '@iot-prototype-kit/core/utils/element';
import { isEmpty } from '@iot-prototype-kit/core/utils/lang2';
import { $site, setSite } from '@iot-prototype-kit/stores/site';
import type { SiteConfig } from '@iot-prototype-kit/types';
import { getSiteConfigs } from '@iot-prototype-kit/utils/config';

import common from '../common.module.css';
import styles from './styles.module.css';

export function SiteMenu({ children, className, ...props }: ComponentProps) {
  const site = useStore($site);
  const siteConfigs = getSiteConfigs();

  if (isEmpty(site) || isEmpty(siteConfigs)) return null;

  const items: Record<string, ReactNode> = {};

  siteConfigs.forEach((siteConfig) => {
    items[siteConfig.id] = <SiteMenuItem siteConfig={siteConfig} selected={siteConfig.id === site.id} />;
  });

  return (
    <DropDownMenu
      className={createClassName(common.menu, styles.menu, className)}
      items={items}
      onSelect={(value) => {
        const siteConfig = siteConfigs.find(({ id }) => id === value);
        if (siteConfig) setSite(siteConfig);
      }}
      selectedKey={site.id}
      {...props}
    >
      <main data-trigger>
        <section data-trigger-name>{site.name}</section>
        <ArrowHeadDownIcon data-trigger-arrow />
      </main>
    </DropDownMenu>
  );
}

function SiteMenuItem({ siteConfig: { name, menuItem }, selected }: { siteConfig: SiteConfig; selected?: boolean }) {
  return (
    <main data-menu-item data-override={!isEmpty(menuItem)} data-selected={selected === true}>
      {menuItem ?? name}
    </main>
  );
}
