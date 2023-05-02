// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import { enableMapSet, produce, type Draft } from 'immer';
import { useEffect, useState } from 'react';

import { isFunction } from '@/lib/utils/lang';

export type State<T> = {
  dispose(): void;
  getState(): T;
  setState(state: T | ((state: Draft<T>) => Draft<T>)): void;
  subscribe(subscriber: Subscriber<T>): () => void;
  unsubscribe(subscriber: Subscriber<T>): void;
};

export type MutableState<T> = {
  dispose(): void;
  getState(): T;
  setState(state: T | ((state: T) => T)): void;
  subscribe(subscriber: Subscriber<T>): () => void;
  unsubscribe(subscriber: Subscriber<T>): void;
};

export type Subscriber<T> = (getState: () => T, unsubscribe: () => void) => void;

export function createMutableState<T>(initialState: T): MutableState<T> {
  let internalState = initialState;
  let subscribers: Subscriber<T>[] = [];

  function dispose() {
    subscribers = [];
  }

  function getState() {
    return internalState;
  }

  function setState(state: T | ((state: T) => T)) {
    internalState = isFunction(state) ? state(internalState) : state;
    subscribers.forEach((subscriber) => subscriber(getState, () => unsubscribe(subscriber)));
  }

  function subscribe(subscriber: Subscriber<T>) {
    subscribers.push(subscriber);

    return () => {
      unsubscribe(subscriber);
    };
  }

  function unsubscribe(subscriber: Subscriber<T>) {
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

export function createState<T>(initialState: T): State<T> {
  let internalState: T = produce(initialState, () => {});
  let subscribers: Subscriber<T>[] = [];

  function dispose() {
    subscribers = [];
  }

  function getState() {
    return produce(internalState, () => {});
  }

  function setState(state: T | ((state: Draft<T>) => Draft<T>)) {
    internalState = isFunction(state)
      ? produce(internalState, (draft) => {
          draft = state(draft);
        })
      : produce(state, () => {});
    subscribers.forEach((subscriber) => subscriber(getState, () => unsubscribe(subscriber)));
  }

  function subscribe(subscriber: Subscriber<T>) {
    subscribers.push(subscriber);

    return () => {
      unsubscribe(subscriber);
    };
  }

  function unsubscribe(subscriber: Subscriber<T>) {
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

export function createMutableStateHook<T>(state: MutableState<T>) {
  return () => {
    const [_state, _setState] = useState(state.getState());

    useEffect(() => {
      return state.subscribe(() => {
        _setState(() => state.getState());
      });
    }, []);

    return [_state, state.setState] as [T, (state: T | ((state: T) => T)) => void];
  };
}

export function createStateHook<T>(state: State<T>) {
  return () => {
    const [_state, _setState] = useState(state.getState());

    useEffect(() => {
      return state.subscribe(() => {
        _setState(state.getState());
      });
    }, []);

    return [_state, state.setState] as [T, (state: T | ((state: Draft<T>) => Draft<T>)) => void];
  };
}

export function enableUseOfMapAndSet() {
  enableMapSet();
}
