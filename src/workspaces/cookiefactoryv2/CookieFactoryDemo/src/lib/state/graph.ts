// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import { createState, createStateHook } from '@/lib/creators/state';

export const hopState = createState<-1 | 0 | 1 | 2>(-1);

export const useHopState = createStateHook(hopState);
