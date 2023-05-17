// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { AppLayout } from '@/lib/components/layouts';
import { createClassName, type ClassName } from '@/lib/core/utils/element';
import { VIEWS } from '@/lib/init/views';
import { GlobalTimeSeriesData } from '@/lib/providers';
import { useViewStore } from '@/lib/stores/view';

import styles from './styles.module.css';

export function AppView({ className }: { className?: ClassName }) {
  const [viewId] = useViewStore();

  return (
    <>
      <main className={createClassName(styles.root, className)}>
        <AppLayout>{viewId ? VIEWS[viewId]?.content : null}</AppLayout>
      </main>
      <GlobalTimeSeriesData />
    </>
  );
}
