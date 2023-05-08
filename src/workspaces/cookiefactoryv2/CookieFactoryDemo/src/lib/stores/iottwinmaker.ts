// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import { createMutableStore, createStoreHook } from '@/lib/core/store';
import type { SceneLoader, IoTTwinMakerClient, TwinMakerDataSource } from '@/lib/types';

export const clientState = createMutableStore<IoTTwinMakerClient | null>(null);
export const dataSourceState = createMutableStore<TwinMakerDataSource | null>(null);
export const sceneLoaderState = createMutableStore<SceneLoader | null>(null);

export const useClientState = createStoreHook(clientState);
export const useDataSourceState = createStoreHook(dataSourceState);
export const useSceneLoaderState = createStoreHook(sceneLoaderState);
