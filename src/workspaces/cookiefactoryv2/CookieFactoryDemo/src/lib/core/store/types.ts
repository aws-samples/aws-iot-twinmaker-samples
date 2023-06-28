// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import type { Draft } from 'immer';
import type { Merge } from 'type-fest';

export type AnyStore<State> = ReadableStore<State> | WritableStore<State>;
export type DerivedStore<State> = ReadableStore<State>;
export type MutableStore<State> = Merge<
  ReadableStore<State>,
  {
    resetToInitialState(): void;
    setState(state: State | ((state: State) => State)): void;
  }
>;

export type ReadableStore<State = any> = {
  dispose(): void;
  getState(): State;
  subscribe(subscriber: Subscriber<State>): () => void;
  unsubscribe(subscriber: Subscriber<State>): void;
};

export type Store<State> = Merge<
  ReadableStore<State>,
  {
    resetToInitialState(): void;
    setState(state: State | ((state: Draft<State>) => Draft<State>)): void;
  }
>;

export type Subscriber<State> = (getState: () => State, unsubscribe: () => void) => void;
export type Transform = { dispose(): void };
export type WritableStore<State = any> = MutableStore<State> | Store<State>;
