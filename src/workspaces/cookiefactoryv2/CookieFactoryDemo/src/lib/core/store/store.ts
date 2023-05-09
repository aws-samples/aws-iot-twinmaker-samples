// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import { produce } from 'immer';
import type { ValueOf } from 'type-fest';

import { isFunction } from '@/lib/utils/lang';
import type { Store, Subscriber } from './types';

export function createStore<State>(initialState: State): Store<State> {
  let internalState: State = produce(initialState, () => {});
  let subscribers: Subscriber<State>[] = [];

  function dispose() {
    subscribers = [];
  }

  function getState() {
    return produce(internalState, () => {});
  }

  function setState(state: Parameters<ValueOf<Store<State>, 'setState'>>[0]) {
    internalState = isFunction(state)
      ? produce(internalState, (draft) => {
          draft = state(draft);
        })
      : produce(state, () => {});
    subscribers.forEach((subscriber) => subscriber(getState, () => unsubscribe(subscriber)));
  }

  function subscribe(subscriber: Parameters<ValueOf<Store<State>, 'subscribe'>>[0]) {
    subscribers.push(subscriber);

    return () => {
      unsubscribe(subscriber);
    };
  }

  function unsubscribe(subscriber: Parameters<ValueOf<Store<State>, 'unsubscribe'>>[0]) {
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
