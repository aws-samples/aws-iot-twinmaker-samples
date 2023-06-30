// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { createMutableStore, createMutableStoreHook } from '@/lib/core/store';
import type { SceneLoader, IoTTwinMakerClient, TwinMakerDataSource } from '@/lib/types';

export const clientStore = createMutableStore<IoTTwinMakerClient | null>(null);
export const dataSourceStore = createMutableStore<TwinMakerDataSource | null>(null);
export const sceneLoaderStore = createMutableStore<SceneLoader | null>(null);
export const useClientStore = createMutableStoreHook(clientStore);
export const useDataSourceStore = createMutableStoreHook(dataSourceStore);
export const useSceneLoaderStore = createMutableStoreHook(sceneLoaderStore);

export function resetIotTwinMakerStores() {
  clientStore.setState(null);
  dataSourceStore.setState(null);
  sceneLoaderStore.setState(null);
}
