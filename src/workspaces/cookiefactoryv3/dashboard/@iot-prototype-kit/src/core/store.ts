// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

export * from 'nanostores';
export * from '@nanostores/react';

// import { useEffect, useState } from 'react';
// import type { Merge, ValueOf } from 'type-fest';

// import { isFunction } from './utils/lang';

// export type Readable<State = any> = {
//   dispose(): void;
//   get(): State;
//   subscribe(subscriber: Subscriber<State>): () => void;
//   unsubscribe(subscriber: Subscriber<State>): void;
// };

// export type Writable<State> = Merge<
//   Readable<State>,
//   {
//     reset(): void;
//     set(state: State | ((state: State) => State)): void;
//   }
// >;

// export type Subscriber<State> = (getState: () => State, unsubscribe: () => void) => void;

// export function derived<State, DerivedState>(
//   store: Readable<State> | Writable<State>,
//   fn: (state: State) => DerivedState
// ): [Readable<DerivedState>, () => DerivedState] {
//   let internalState = fn(store.get());
//   let subscribers: Subscriber<DerivedState>[] = [];

//   function dispose() {
//     unsubscribeSource();
//     subscribers = [];
//   }

//   function get() {
//     return internalState;
//   }

//   const subscribe: ValueOf<Readable<DerivedState>, 'subscribe'> = (subscriber) => {
//     subscribers.push(subscriber);

//     return () => {
//       unsubscribe(subscriber);
//     };
//   };

//   const unsubscribe: ValueOf<Readable<DerivedState>, 'unsubscribe'> = (subscriber) => {
//     subscribers = subscribers.filter((sub) => sub !== subscriber);
//   };

//   const unsubscribeSource = store.subscribe((getState) => {
//     internalState = fn(getState());
//     subscribers.forEach((subscriber) => subscriber(get, () => unsubscribe(subscriber)));
//   });

//   const _store = { dispose, get, subscribe, unsubscribe };

//   return [_store, hookReadable(_store)];
// }

// export function hookReadable<State>(store: Readable<State>): () => State {
//   return () => {
//     const [state, setState] = useState(store.get());

//     useEffect(() => {
//       return store.subscribe(() => {
//         setState(store.get());
//       });
//     }, []);

//     return state;
//   };
// }

// export function hookWritable<State>(store: Writable<State>): () => [State, ValueOf<Writable<State>, 'set'>] {
//   return () => {
//     const [state, setState] = useState(store.get());

//     useEffect(() => {
//       return store.subscribe(() => {
//         setState(store.get());
//       });
//     }, []);

//     return [state, store.set];
//   };
// }

// export function isReadable<State>(store: Readable<State> | Writable<State>): store is Readable<State> {
//   return !isWritable(store);
// }

// export function isWritable<State>(store: Readable<State> | Writable<State>): store is Writable<State> {
//   return Object.hasOwn(store, 'set');
// }

// export function readable<State>(initialState: State): [Readable<State>, () => State] {
//   const [{ reset, set, ...readable }] = writable(initialState);
//   return [readable, hookReadable(readable)];
// }

// export function writable<State>(
//   initialState: State
// ): [Writable<State>, () => [State, ValueOf<Writable<State>, 'set'>]] {
//   let internalState = structuredClone(initialState);
//   let subscribers: Subscriber<State>[] = [];

//   const set: ValueOf<Writable<State>, 'set'> = (state) => {
//     const newState = isFunction(state) ? state(internalState) : state;

//     if (Object.is(internalState, newState) === false) {
//       internalState = newState;
//       subscribers.forEach((subscriber) => subscriber(get, () => unsubscribe(subscriber)));
//     }
//   };

//   const subscribe: ValueOf<Writable<State>, 'subscribe'> = (subscriber) => {
//     subscribers.push(subscriber);

//     return () => {
//       unsubscribe(subscriber);
//     };
//   };

//   const unsubscribe: ValueOf<Writable<State>, 'unsubscribe'> = (subscriber) => {
//     subscribers = subscribers.filter((sub) => sub !== subscriber);
//   };

//   function dispose() {
//     subscribers = [];
//   }

//   function get() {
//     return internalState;
//   }

//   function reset() {
//     set(structuredClone(initialState));
//   }

//   const store = {
//     dispose,
//     get,
//     reset,
//     set,
//     subscribe,
//     unsubscribe
//   };

//   return [store, hookWritable(store)];
// }
