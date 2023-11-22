// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { action, atom } from '@iot-prototype-kit/core/store';
import type {
  CameraConfig,
  SceneLoader,
  IoTTwinMakerClient,
  TwinMakerDataSource,
  TwinMakerSceneMetadataModule
} from '@iot-prototype-kit/types';

import { $site } from './site';

export const $activeCamera = atom<CameraConfig | null>(null);
export const $client = atom<IoTTwinMakerClient | null>(null);
export const $dataSource = atom<TwinMakerDataSource | null>(null);
export const $sceneLoader = atom<SceneLoader | null>(null);
export const $sceneMetadataModule = atom<TwinMakerSceneMetadataModule | null>(null);

export const resetActiveCamera = action($activeCamera, 'resetActiveCamera', ({ set }) => set(null));

export const resetClient = action($client, 'resetClient', ({ get, set }) => {
  get()?.destroy();
  set(null);
});

export const resetDataSource = action($dataSource, 'resetDataSource', ({ set }) => set(null));
export const resetSceneLoader = action($sceneLoader, 'resetSceneLoader', ({ set }) => set(null));
export const resetSceneMetadataModule = action($sceneMetadataModule, 'resetSceneMetadataModule', ({ set }) =>
  set(null)
);
