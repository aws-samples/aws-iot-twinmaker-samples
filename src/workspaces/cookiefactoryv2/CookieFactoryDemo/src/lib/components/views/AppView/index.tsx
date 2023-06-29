// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from 'react';

import { AppLayout } from '@/lib/components/layouts';
import { getAllHistoryQueries } from '@/lib/init/entities';
import { VIEWS } from '@/lib/init/views';
import { TimeSeriesData } from '@/lib/providers';
import { useViewStore } from '@/lib/stores/view';

import styles from './styles.module.css';

export function AppView() {
  const [viewId] = useViewStore();

  const historyQueries = useMemo(() => {
    return [...getAllHistoryQueries('data'), ...getAllHistoryQueries('alarm-state')];
  }, []);

  const view = useMemo(() => {
    if (viewId) {
      return VIEWS[viewId].content;
    }

    return null;
  }, [viewId]);

  return (
    <>
      <AppLayout className={styles.layout}>{view}</AppLayout>
      <TimeSeriesData historyQueries={historyQueries} />
    </>
  );
}
