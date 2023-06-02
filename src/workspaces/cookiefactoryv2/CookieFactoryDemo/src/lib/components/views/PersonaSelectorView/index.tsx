// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useState } from 'react';

import { getAwsCredentials } from '@/lib/core/auth/cognito';
import { AWS_CREDENTIAL_CONFIG } from '@/lib/init/credentials';
import { USERS } from '@/lib/init/users';
import { useUserStore } from '@/lib/stores/user';
import { createClassName, type ClassName } from '@/lib/core/utils/element';
import type { User } from '@/lib/types';

import styles from './styles.module.css';

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
    <main className={createClassName(styles.root, className, { [styles.rootActive]: isActive })}>
      <section className={styles.head}>Choose a role</section>
      <section className={styles.personas}>{personaElements}</section>
    </main>
  );
}

function PersonaElement({ handlePointerUp, user }: { handlePointerUp: (user: User) => void; user: User }) {
  const [isActive, setIsActive] = useState(false);

  return (
    <button
      className={createClassName(styles.persona, { [styles.personaActive]: isActive })}
      onPointerUp={() => {
        setIsActive(true);
        handlePointerUp(user);
      }}
    >
      <section className={styles.personaIcon}>{user.icon}</section>
      <section className={styles.personaGroup}>
        <section className={styles.personaName}>{`${user.firstName} ${user.lastName}`}</section>
        <section className={styles.personaTitle}>{user.title}</section>
      </section>
    </button>
  );
}
