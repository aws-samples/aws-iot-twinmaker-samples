// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import { useEffect } from 'react';

import { AppLayout } from '@/lib/components/layouts';
import { createClassName, type ClassName } from '@/lib/core/utils/element';
import { defaultAlarmHistoryQuery, defaultDataHistoryQuery } from '@/lib/init/entities';
import { VIEWS } from '@/lib/init/views';
import { TimeSeriesContext } from '@/lib/providers';
import {
  alarmHistoryQueryState,
  dataHistoryQueryState,
  selectedState,
  useAlarmHistoryQueryState,
  useDataHistoryQueryState
} from '@/lib/stores/entity';
import { hopState } from '@/lib/stores/graph';
import { useViewState } from '@/lib/stores/view';
import { createHistoryQueries, createHistoryQuery } from '@/lib/utils/entity';

import styles from './styles.module.css';

export function AppView({ className }: { className?: ClassName }) {
  const [alarmHistoryQuery] = useAlarmHistoryQueryState();
  const [dataHistoryQuery] = useDataHistoryQueryState();
  const [viewId] = useViewState();

  useEffect(() => {
    alarmHistoryQueryState.setState(defaultAlarmHistoryQuery);
    dataHistoryQueryState.setState(defaultDataHistoryQuery);

    return selectedState.subscribe((getState) => {
      const { entityData } = getState();
      const useSelectedEntity = hopState.getState() !== -1 && entityData;

      const alarmHistoryQuery = useSelectedEntity
        ? [createHistoryQuery(entityData, 'alarm')]
        : defaultAlarmHistoryQuery;

      const dataHistoryQuery = useSelectedEntity ? createHistoryQueries(entityData, 'data') : defaultDataHistoryQuery;

      alarmHistoryQueryState.setState(alarmHistoryQuery);
      dataHistoryQueryState.setState(dataHistoryQuery);
    });
  }, []);

  return (
    <>
      <main className={createClassName(styles.root, className)}>
        <AppLayout>{viewId ? VIEWS[viewId]?.content : null}</AppLayout>
      </main>
      <TimeSeriesContext queries={[...alarmHistoryQuery, ...dataHistoryQuery]} />
    </>
  );
}
