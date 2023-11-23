// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { AppLayout } from '@iot-prototype-kit/components/layouts/AppLayout';
import { useStore } from '@iot-prototype-kit/core/store';
import type { ComponentProps } from '@iot-prototype-kit/core/utils/element';
import { TimeSeriesData } from '@iot-prototype-kit/providers/TimeSeriesData';
import { $entityHistoryQueries } from '@iot-prototype-kit/stores/entity';

export function AppView({ children, className, ...props }: ComponentProps) {
  const entityHistoryQueries = useStore($entityHistoryQueries);

  return (
    <>
      <AppLayout className={className} {...props}>
        {children}
      </AppLayout>
      <TimeSeriesData entityHistoryQueries={entityHistoryQueries} />
    </>
  );
}
