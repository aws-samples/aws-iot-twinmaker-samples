// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import { useEffect, useState } from 'react';

import { getAwsCredentials } from '@/lib/authentication';
import { AWS_CREDENTIAL_CONFIG } from '@/lib/credentials';
import { useUserState } from '@/lib/state/user';
import { USERS } from '@/lib/users';
import { createClassName, type ClassName } from '@/lib/utils/element';
import type { User } from '@/lib/types';

import styles from './styles.module.css';

let disabled = false;

export function PersonaSelectorView({ className }: { className?: ClassName }) {
  const [, setUser] = useUserState();
  const [isActive, setIsActive] = useState(false);

  async function handlePointerDown({ firstName, icon, lastName, password, title, email }: User) {
    if (!disabled) {
      disabled = true;
      setIsActive(true);
      try {
        const awsCredentials = await getAwsCredentials({ ...AWS_CREDENTIAL_CONFIG, username: email, password });
        setUser({ awsCredentials, email, firstName, icon, lastName, password, title });
      } catch (e) {
        console.error(e);
        setUser(null);
        setIsActive(false);
      }
      disabled = false;
    }
  }

  const personaElements = USERS.map((user) => {
    return <PersonaElement key={user.email} handlePointerDown={handlePointerDown} user={user} />;
  });

  useEffect(() => setUser(null), []);

  return (
    <main className={createClassName(styles.root, className, { [styles.rootActive]: isActive })}>
      <section className={styles.head}>Choose a role</section>
      <section className={styles.personas}>{personaElements}</section>
    </main>
  );
}

function PersonaElement({ handlePointerDown, user }: { handlePointerDown: (user: User) => void; user: User }) {
  const [isActive, setIsActive] = useState(false);

  return (
    <button
      className={createClassName(styles.persona, { [styles.personaActive]: isActive })}
      onPointerDown={() => {
        setIsActive(true);
        handlePointerDown(user);
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
