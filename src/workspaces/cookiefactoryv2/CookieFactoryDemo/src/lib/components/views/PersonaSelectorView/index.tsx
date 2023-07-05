// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useState } from 'react';

import { CookieFactoryLogoWide } from '@/lib/components/svgs/logos';
import { getAwsCredentials } from '@/lib/core/auth/cognito';
import { AWS_CREDENTIAL_CONFIG } from '@/lib/init/credentials';
import { USERS } from '@/lib/init/users';
import { useUserStore } from '@/lib/stores/user';
import { createClassName, type ClassName } from '@/lib/core/utils/element';
import type { User } from '@/lib/types';

import styles from './styles.module.css';

const HEAD_LABEL = `Choose a role`;
let disabled = false;

export function PersonaSelectorView({ className }: { className?: ClassName }) {
  const [, setUser] = useUserStore();
  const [isActive, setIsActive] = useState(false);

  async function handlePointerUp({ firstName, icon, id, lastName, password, title, email }: User) {
    if (!disabled) {
      disabled = true;
      setIsActive(true);
      try {
        const awsCredentials = await getAwsCredentials({ ...AWS_CREDENTIAL_CONFIG, username: email, password });
        setUser({ awsCredentials, email, firstName, icon, id, lastName, password, title });
      } catch (e) {
        console.error(e);
        setUser(null);
        setIsActive(false);
      }
      disabled = false;
    }
  }

  const personaElements = USERS.map((user) => {
    return <PersonaElement key={user.id} handlePointerUp={handlePointerUp} user={user} />;
  });

  useEffect(() => setUser(null), []);

  return (
    <main className={createClassName(styles.root, className)} data-is-active={isActive}>
      <CookieFactoryLogoWide className={styles.logo} />
      <div className={styles.head}>{HEAD_LABEL}</div>
      <div className={styles.items}>{personaElements}</div>
    </main>
  );
}

function PersonaElement({ handlePointerUp, user }: { handlePointerUp: (user: User) => void; user: User }) {
  const [isActive, setIsActive] = useState(false);

  return (
    <button
      className={styles.item}
      data-is-active={isActive}
      onPointerUp={() => {
        setIsActive(true);
        handlePointerUp(user);
      }}
    >
      <section className={styles.itemIcon}>{user.icon}</section>
      <section className={styles.itemGroup}>
        <section className={styles.itemName}>{`${user.firstName} ${user.lastName}`}</section>
        <section className={styles.itemTitle}>{user.title}</section>
      </section>
    </button>
  );
}
