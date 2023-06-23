// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { VideoPlayer } from '@iot-app-kit/react-components';
import { useMemo, type ReactNode } from 'react';

import { createClassName, type ClassName } from '@/lib/core/utils/element';
import { useDataSourceStore } from '@/lib/stores/iottwinmaker';

import styles from './styles.module.css';

export function VideoPanel({ children, className }: { children?: ReactNode; className?: ClassName }) {
  const [dataSource] = useDataSourceStore();

  const player = useMemo(() => {
    if (dataSource) {
      const videoData = dataSource.videoData({
        entityId: 'FREEZER_TUNNEL_e12e0733-f5df-4604-8f10-417f49e6d298',
        componentName: 'VideoStream',
        kvsStreamName: 'cookiefactory_mixerroom_camera_01'
      });

      return <VideoPlayer videoData={videoData} viewport={{ duration: '0' }} />;
    }

    return null;
  }, [dataSource]);

  return (
    <main className={createClassName(styles.root, className)}>
      <div className={styles.video}>{player}</div>
    </main>
  );
}
