// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useMemo, useState } from 'react';

import { AvatarIcon } from '@iot-prototype-kit/components/svgs/icons/AvatarIcon';
import { useStore } from '@iot-prototype-kit/core/store';
import { createClassName, type ClassName } from '@iot-prototype-kit/core/utils/element';
import { $appConfig } from '@iot-prototype-kit/stores/config';
import { $user } from '@iot-prototype-kit/stores/user';
import type { UserConfig } from '@iot-prototype-kit/types';
import { authenticateUser, getUserFullName } from '@iot-prototype-kit/utils/user';

import styles from './styles.module.css';

const TITLE = 'Choose a role';
let disabled = false;

export function UserSelectorView({ className }: { className?: ClassName }) {
  const appConfig = useStore($appConfig);
  const [isActive, setIsActive] = useState(false);

  const handlePointerUp = useCallback(async (userConfig: UserConfig) => {
    if (!disabled) {
      disabled = true;
      setIsActive(true);

      const user = await authenticateUser(userConfig);

      if (user) {
        $user.set(user);
      } else {
        $user.set(null);
        setIsActive(false);
      }

      disabled = false;
    }
  }, []);

  const userElements = useMemo(() => {
    return appConfig.userConfigs.map((userConfig) => {
      return <UserElement handlePointerUp={handlePointerUp} key={userConfig.email} userConfig={userConfig} />;
    });
  }, [appConfig]);

  useEffect(() => $user.set(null), []);

  return (
    <main className={createClassName(styles.root, className)} data-is-active={isActive}>
      <section className={styles.branding}>{appConfig?.branding}</section>
      <section className={styles.title}>{TITLE}</section>
      <section className={styles.cards}>{userElements}</section>
    </main>
  );
}

function UserElement({
  handlePointerUp,
  userConfig
}: {
  handlePointerUp: (userConfig: UserConfig) => void;
  userConfig: UserConfig;
}) {
  const [isActive, setIsActive] = useState(false);

  return (
    <button
      className={styles.card}
      data-is-active={isActive}
      onPointerUp={() => {
        setIsActive(true);
        handlePointerUp(userConfig);
      }}
    >
      <section className={styles.cardAvatar}>{userConfig.avatar ?? <AvatarIcon />}</section>
      <section className={styles.cardGroup}>
        <div className={styles.cardName}>{getUserFullName(userConfig)}</div>
        <div className={styles.cardTitle}>{userConfig.title}</div>
      </section>
    </button>
  );
}
