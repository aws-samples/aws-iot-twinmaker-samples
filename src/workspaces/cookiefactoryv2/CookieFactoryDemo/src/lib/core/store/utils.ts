// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { enableMapSet } from 'immer';
import { useEffect, useState } from 'react';
import type { ValueOf } from 'type-fest';

import type { AnyStore, DerivedStore, MutableStore, ReadableStore, Store, Transform, WritableStore } from './types';

export function createDerivedStoreHook<State>(store: DerivedStore<State>) {
  return () => {
    const [state, setState] = useState(store.getState());

    useEffect(() => {
      return store.subscribe((getState) => {
        setState(getState());
      });
    }, []);

    return state;
  };
}

export function createMutableStoreHook<State>(store: MutableStore<State>) {
  return () => {
    const [state, setState] = useState(store.getState());

    useEffect(() => {
      return store.subscribe((getState) => {
        setState(getState());
      });
    }, []);

    return [state, store.setState] as [State, typeof store.setState];
  };
}

export function createStoreHook<State>(store: Store<State>) {
  return () => {
    const [state, setState] = useState(store.getState());

    useEffect(() => {
      return store.subscribe((getState) => {
        setState(getState());
      });
    }, []);

    return [state, store.setState] as [State, typeof store.setState];
  };
}

export function enableUseOfMapAndSet() {
  enableMapSet();
}

export function isReadableStore<State>(store: AnyStore<State>): store is ReadableStore<State> {
  return !isWritableStore(store);
}

export function isWritableStore<State>(store: AnyStore<State>): store is WritableStore<State> {
  return Object.keys(store).includes('setState');
}

export function transform<SourceState, DestinationState>(
  sourceStore: Store<SourceState> | MutableStore<SourceState>,
  desitnationStore: Store<DestinationState> | MutableStore<DestinationState>,
  transform: (sourceState: SourceState, destinationState: DestinationState) => DestinationState
): Transform {
  const unsubscribe = sourceStore.subscribe(() => {
    desitnationStore.setState(transform(sourceStore.getState(), desitnationStore.getState()));
  });

  return {
    dispose() {
      unsubscribe();
    }
  };
}
