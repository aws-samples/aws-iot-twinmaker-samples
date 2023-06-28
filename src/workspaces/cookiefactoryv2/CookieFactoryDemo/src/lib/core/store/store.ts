// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { produce } from 'immer';
import type { ValueOf } from 'type-fest';

import { isFunction } from '../utils/lang';
import { enableUseOfMapAndSet } from './utils';
import type { Store, Subscriber } from './types';

enableUseOfMapAndSet();

export function createStore<State>(initialState: State): Store<State> {
  let internalState: State = produce(initialState, () => {});
  let subscribers: Subscriber<State>[] = [];

  function dispose() {
    subscribers = [];
  }

  function getState() {
    return produce(internalState, () => {});
  }

  function resetToInitialState() {
    setState(initialState);
  }

  function setState(state: Parameters<ValueOf<Store<State>, 'setState'>>[0]) {
    internalState = isFunction(state)
      ? produce(internalState, (draft) => {
          draft = state(draft);
        })
      : produce(state, () => {});
    subscribers.forEach((subscriber) => subscriber(getState, () => unsubscribe(subscriber)));
  }

  function subscribe(subscriber: Subscriber<State>) {
    subscribers.push(subscriber);

    return () => {
      unsubscribe(subscriber);
    };
  }

  function unsubscribe(subscriber: Subscriber<State>) {
    subscribers = subscribers.filter((sub) => sub !== subscriber);
  }

  return {
    dispose,
    getState,
    resetToInitialState,
    setState,
    subscribe,
    unsubscribe
  };
}
