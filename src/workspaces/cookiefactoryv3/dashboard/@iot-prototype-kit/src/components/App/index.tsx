// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useMemo } from 'react';

import { AppView } from '@iot-prototype-kit/components/views/AppView';
import { GenAiView } from '@iot-prototype-kit/components/views/GenAiView';
import { PaneView } from '@iot-prototype-kit/components/views/PaneView';
import { SiteSelectorView } from '@iot-prototype-kit/components/views/SiteSelectorView';
import { UserSelectorView } from '@iot-prototype-kit/components/views/UserSelectorView';
import { useStore } from '@iot-prototype-kit/core/store';
import { $appConfig } from '@iot-prototype-kit/stores/config';
import { $site } from '@iot-prototype-kit/stores/site';
import { $user } from '@iot-prototype-kit/stores/user';
import type { AppConfig } from '@iot-prototype-kit/types';
import { getRouteConfigs } from '@iot-prototype-kit/utils/config';
import type { ComponentProps } from '@iot-prototype-kit/core/utils/element';
import { isEmpty } from '@iot-prototype-kit/core/utils/lang2';

import '@iot-prototype-kit/css/preflight.css';

import { panelConfigs } from '@/app.config';

const PROD_CHAINLIT_URL = 'http://localhost:8000';
const genaiViewId = crypto.randomUUID();

export function App({
  children,
  className,
  config,
  ...props
}: ComponentProps<{
  config: AppConfig;
}>) {
  const site = useStore($site);
  const user = useStore($user);

  const queryParams = new URLSearchParams(window.location.search);
  const chainlitUrl = queryParams.get('cl') ?? PROD_CHAINLIT_URL;

  const child = useMemo(() => {
    if (isEmpty(user)) {
      return <UserSelectorView />;
    }

    if (isEmpty(site)) {
      return <SiteSelectorView />;
    }

    const routeConfig = getRouteConfigs()?.find(({ path }) => path === '/');

    return (
      // <AppView className={className} {...props}>
      //   {routeConfig?.view}
      //   <GenAiView chainlitUrl={chainlitUrl} id={genaiViewId} />
      // </AppView>
      <PaneView panelConfigs={panelConfigs} />
    );
  }, [site, user]);

  useEffect(() => {
    $appConfig.set(config);
  }, [config]);

  return child;
}
