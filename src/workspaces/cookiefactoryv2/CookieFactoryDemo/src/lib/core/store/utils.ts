// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import { enableMapSet } from 'immer';
import { useEffect, useState } from 'react';
import type { ValueOf } from 'type-fest';

import type { DerivedStore, MutableStore, Store, Transform } from './types';

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

export function createMutableStoreHook<State>(
  store: MutableStore<State>
): () => [State, ValueOf<MutableStore<State>, 'setState'>] {
  return () => {
    const [state, setState] = useState(store.getState());

    useEffect(() => {
      return store.subscribe((getState) => {
        setState(getState());
      });
    }, []);

    return [state, store.setState];
  };
}

export function createStoreHook<State>(store: Store<State>): () => [State, ValueOf<Store<State>, 'setState'>] {
  return () => {
    const [state, setState] = useState(store.getState());

    useEffect(() => {
      return store.subscribe((getState) => {
        setState(getState());
      });
    }, []);

    return [state, store.setState];
  };
}

export function enableUseOfMapAndSet() {
  enableMapSet();
}

export function isDerivedStore<State>(
  store: Store<State> | MutableStore<State> | DerivedStore<State>
): store is DerivedStore<State> {
  return Object.keys(store).includes('setState') === false;
}

export function isStoreOrMutableStore<State>(
  store: Store<State> | MutableStore<State> | DerivedStore<State>
): store is Store<State> | MutableStore<State> {
  return !isDerivedStore(store);
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
