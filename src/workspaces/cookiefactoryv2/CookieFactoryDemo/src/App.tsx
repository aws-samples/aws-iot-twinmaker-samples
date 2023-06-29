// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { WebglContext } from '@iot-app-kit/react-components';
import { useMemo } from 'react';

import { AppView, PersonaSelectorView, SiteSelectorView } from '@/lib/components/views';
import { isNil } from '@/lib/core/utils/lang';
import { useSiteStore } from '@/lib/stores/site';
import { useUserStore } from '@/lib/stores/user';

import './app.css';

export function App() {
  const [site] = useSiteStore();
  const [user] = useUserStore();

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
      <WebglContext />
    </>
  );
}
