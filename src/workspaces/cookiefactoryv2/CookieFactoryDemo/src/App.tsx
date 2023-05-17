// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { WebglContext } from '@iot-app-kit/react-components';
import { useEffect, useMemo, useState } from 'react';

import { AppView, PersonaSelectorView, SiteSelectorView } from '@/lib/components/views';
import { createClassName } from '@/lib/core/utils/element';
import { isNil } from '@/lib/core/utils/lang';
import { usePanelsStore } from '@/lib/stores/panels';
import { useSiteStore } from '@/lib/stores/site';
import { useUserStore } from '@/lib/stores/user';

import './app.css';
import styles from './app.module.css';

export function App() {
  const [panels] = usePanelsStore();
  const [site] = useSiteStore();
  const [user] = useUserStore();
  const [shouldHideCanvas, setShouldHideCanvas] = useState(true);

  useEffect(() => {
    const isHidden = !panels.includes('dashboard');
    document.body.classList.toggle('hide-appkit', isHidden);
    setShouldHideCanvas(isHidden);
  }, [panels]);

  const route = useMemo(() => {
    if (isNil(user)) {
      return <PersonaSelectorView />;
    }

    if (isNil(site)) {
      return <SiteSelectorView />;
    }

    return <AppView />;
  }, [site, user]);

  return (
    <>
      {route}
      <WebglContext className={createClassName({ [styles.hidden]: shouldHideCanvas })} />
    </>
  );
}
