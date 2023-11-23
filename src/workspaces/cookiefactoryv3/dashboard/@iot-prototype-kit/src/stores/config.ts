// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { action, atom } from '@iot-prototype-kit/core/store';
import type { AppConfig } from '@iot-prototype-kit/types';

const DEFAULT_STATE: AppConfig = { userConfigs: [] };

export const $appConfig = atom<AppConfig>(DEFAULT_STATE);

export const resetAppConfig = action($appConfig, 'resetAppConfig', (store) => store.set(DEFAULT_STATE));
