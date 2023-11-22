// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from 'react';

import { FactoryIcon } from '@iot-prototype-kit/components/svgs/icons/FactoryIcon';
import { useStore } from '@iot-prototype-kit/core/store';
import { createClassName, type ComponentProps } from '@iot-prototype-kit/core/utils/element';
import { $appConfig } from '@iot-prototype-kit/stores/config';
import { setSite } from '@iot-prototype-kit/stores/site';
import type { SiteConfig } from '@iot-prototype-kit/types';
import { getSiteConfigs } from '@iot-prototype-kit/utils/config';

import styles from './styles.module.css';

const TITLE = 'Choose a location';

export function SiteSelectorView({ className }: ComponentProps) {
  const { branding } = useStore($appConfig);
  const siteConfigs = getSiteConfigs();

  const siteElements = useMemo(() => {
    return siteConfigs?.map((siteConfig) => {
      return <SiteElement key={siteConfig.id} handlePointerUp={() => setSite(siteConfig)} siteConfig={siteConfig} />;
    });
  }, [siteConfigs]);

  return (
    <main className={createClassName(styles.root, className, {})}>
      <section className={styles.branding}>{branding}</section>
      <section className={styles.title}>{TITLE}</section>
      <section className={styles.cards}>{siteElements}</section>
    </main>
  );
}

function SiteElement({
  handlePointerUp,
  siteConfig
}: {
  handlePointerUp: (siteConfig: SiteConfig) => void;
  siteConfig: SiteConfig;
}) {
  return (
    <button className={styles.card} onPointerUp={() => handlePointerUp(siteConfig)}>
      {siteConfig.icon ?? <FactoryIcon className={styles.cardIcon} />}
      <section className={styles.cardGroup}>
        <section className={styles.cardName}>{siteConfig.name}</section>
        <section className={styles.cardTitle}>{siteConfig.description}</section>
      </section>
    </button>
  );
}
