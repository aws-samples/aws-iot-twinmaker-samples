// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import { createMutableState, createMutableStateHook } from '@/lib/creators/state';
import type { SceneLoader, IoTTwinMakerClient, TwinMakerDataSource } from '@/lib/types';

export const clientState = createMutableState<IoTTwinMakerClient | null>(null);
export const dataSourceState = createMutableState<TwinMakerDataSource | null>(null);
export const sceneLoaderState = createMutableState<SceneLoader | null>(null);

export const useClientState = createMutableStateHook(clientState);
export const useDataSourceState = createMutableStateHook(dataSourceState);
export const useSceneLoaderState = createMutableStateHook(sceneLoaderState);
