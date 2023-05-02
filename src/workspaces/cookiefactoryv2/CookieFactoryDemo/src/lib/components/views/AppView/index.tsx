// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import { AppLayout } from '@/lib/components/layouts';
import { defaultAlarmHistoryQuery, defaultDataHistoryQuery } from '@/lib/entities';
import { TimeSeriesContext } from '@/lib/providers';
import {
  alarmHistoryQueryState,
  dataHistoryQueryState,
  selectedState,
  useAlarmHistoryQueryState,
  useDataHistoryQueryState
} from '@/lib/state/entity';
import { hopState } from '@/lib/state/graph';
import { useViewState } from '@/lib/state/view';
import { createClassName, type ClassName } from '@/lib/utils/element';
import { createHistoryQueries, createHistoryQuery } from '@/lib/utils/entity';
import { VIEWS } from '@/lib/views';
import { useEffect } from 'react';

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
