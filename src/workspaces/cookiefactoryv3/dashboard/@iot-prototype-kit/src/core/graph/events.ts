// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import type { Merge } from 'type-fest';

import { atom } from '@iot-prototype-kit/core/store';

import type { Core, EdgeSingular, EventName, EventObject, NodeSingular } from './types';

type GraphEvent = Merge<
  EventObject,
  {
    target: Core | EdgeSingular | NodeSingular;
    type: EventName;
  }
>;

export const $event = atom<GraphEvent | null>(null);
