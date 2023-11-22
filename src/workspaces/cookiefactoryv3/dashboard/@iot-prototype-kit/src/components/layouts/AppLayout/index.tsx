// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import type { ReactNode } from 'react';

import { BodyLayout } from '@iot-prototype-kit/components/layouts/BodyLayout';
import { HeaderLayout } from '@iot-prototype-kit/components/layouts/HeaderLayout';
import { Clock } from '@iot-prototype-kit/components/layouts/HeaderLayout/components/Clock';
import { Logo } from '@iot-prototype-kit/components/layouts/HeaderLayout/components/Logo';
import { SiteMenu } from '@iot-prototype-kit/components/layouts/HeaderLayout/components/SiteMenu';
import { StatusBar } from '@iot-prototype-kit/components/layouts/HeaderLayout/components/StatusBar';
import { UserMenu } from '@iot-prototype-kit/components/layouts/HeaderLayout/components/UserMenu';
import { createClassName, type ComponentProps } from '@iot-prototype-kit/core/utils/element';
import { $appConfig } from '@iot-prototype-kit/stores/config';

import './styles.css';

export function AppLayout({
  children,
  className,
  statusBarItems,
  ...props
}: ComponentProps<{
  statusBarItems?: ReactNode;
}>) {
  return (
    <main className={createClassName(className)} data-applayout {...props}>
      <HeaderLayout>
        <Logo>{$appConfig.get().branding}</Logo>
        <SiteMenu />
        <StatusBar />
        <Clock />
        <UserMenu />
      </HeaderLayout>
      <BodyLayout>{children}</BodyLayout>
    </main>
  );
}
