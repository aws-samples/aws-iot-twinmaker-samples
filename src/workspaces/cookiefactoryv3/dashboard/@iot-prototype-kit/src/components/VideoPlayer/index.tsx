// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { VideoPlayer as _VideoPlayer } from '@iot-app-kit/react-components';

import { createClassName, type ComponentProps } from '@iot-prototype-kit/core/utils/element';
import { $dataSource } from '@iot-prototype-kit/stores/iottwinmaker';
import type { Viewport } from '@iot-prototype-kit/types';

export function VideoPlayer({
  className,
  componentName,
  entityId,
  viewport,
  ...props
}: ComponentProps<{ componentName: string; entityId: string; viewport: Viewport }>) {
  const videoData = $dataSource.get()?.videoData({ entityId, componentName });

  return videoData ? (
    <section className={createClassName(className)} {...props}>
      <_VideoPlayer videoData={videoData} viewport={viewport} />
    </section>
  ) : null;
}
