// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import type { AnyStore, DerivedStore, Subscriber } from './types';

export function createDerivedStore<SourceState, DerivedState>(
  sourceStore: AnyStore<SourceState>,
  fn: (state: SourceState) => DerivedState
): DerivedStore<DerivedState> {
  let internalState = fn(sourceStore.getState());
  let subscribers: Subscriber<DerivedState>[] = [];

  const unsubscribeSource = sourceStore.subscribe((getSourceState) => {
    internalState = fn(getSourceState());
    subscribers.forEach((subscriber) => subscriber(getState, () => unsubscribe(subscriber)));
  });

  function dispose() {
    unsubscribeSource();
    subscribers = [];
  }

  function getState() {
    return internalState;
  }

  function subscribe(subscriber: Subscriber<DerivedState>) {
    subscribers.push(subscriber);

    return () => {
      unsubscribe(subscriber);
    };
  }

  function unsubscribe(subscriber: Subscriber<DerivedState>) {
    subscribers = subscribers.filter((sub) => sub !== subscriber);
  }

  return {
    dispose,
    getState,
    subscribe,
    unsubscribe
  };
}
