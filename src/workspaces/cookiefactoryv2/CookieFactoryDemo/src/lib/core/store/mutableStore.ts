// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import type { ValueOf } from 'type-fest';

import { isFunction } from '@/lib/core/utils/lang';
import type { MutableStore, Subscriber } from './types';

export function createMutableStore<State>(initialState: State): MutableStore<State> {
  let internalState = initialState;
  let subscribers: Subscriber<State>[] = [];

  function dispose() {
    subscribers = [];
  }

  function getState() {
    return internalState;
  }

  function setState(state: Parameters<ValueOf<MutableStore<State>, 'setState'>>[0]) {
    internalState = isFunction(state) ? state(internalState) : state;
    subscribers.forEach((subscriber) => subscriber(getState, () => unsubscribe(subscriber)));
  }

  function subscribe(subscriber: Parameters<ValueOf<MutableStore<State>, 'subscribe'>>[0]) {
    subscribers.push(subscriber);

    return () => {
      unsubscribe(subscriber);
    };
  }

  function unsubscribe(subscriber: Parameters<ValueOf<MutableStore<State>, 'unsubscribe'>>[0]) {
    subscribers = subscribers.filter((sub) => sub !== subscriber);
  }

  return {
    dispose,
    getState,
    setState,
    subscribe,
    unsubscribe
  };
}
