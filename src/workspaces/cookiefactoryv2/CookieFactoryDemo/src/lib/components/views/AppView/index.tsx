// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from 'react';

import { AppLayout } from '@/lib/components/layouts';
import { getAllHistoryQueries } from '@/lib/init/entities';
import { VIEWS } from '@/lib/init/views';
import { TimeSeriesData } from '@/lib/providers';
import { useSiteStore } from '@/lib/stores/site';
import { useViewStore } from '@/lib/stores/view';

import styles from './styles.module.css';

export function AppView() {
  const [site] = useSiteStore();
  const [view] = useViewStore();

  const historyQueries = useMemo(() => {
    return [...getAllHistoryQueries('data'), ...getAllHistoryQueries('alarm-state')];
  }, [site]);

  const viewElement = useMemo(() => {
    if (view) {
      return VIEWS[view].content;
    }

    return null;
  }, [view]);

  return (
    <>
      <AppLayout className={styles.layout}>{viewElement}</AppLayout>
      <TimeSeriesData historyQueries={historyQueries} />
    </>
  );
}
