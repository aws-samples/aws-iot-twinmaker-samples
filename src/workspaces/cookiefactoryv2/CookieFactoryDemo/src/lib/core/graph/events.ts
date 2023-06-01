// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import type { Merge } from 'type-fest';

import { createMutableStore, createMutableStoreHook } from '../store';
import type { Core, EdgeSingular, EventName, EventObject, NodeSingular } from './types';

type GraphEvent = Merge<
  EventObject,
  {
    target: Core | EdgeSingular | NodeSingular;
    type: EventName;
  }
>;

export const eventStore = createMutableStore<GraphEvent | null>(null);
export const useEventStore = createMutableStoreHook(eventStore);
