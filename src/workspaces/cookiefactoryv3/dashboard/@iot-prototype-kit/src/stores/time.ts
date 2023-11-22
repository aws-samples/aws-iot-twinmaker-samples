// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { atom, onMount } from '@iot-prototype-kit/core/store';

export const $now = atom<number>(Date.now());

onMount($now, () => {
  $now.set(Date.now());

  const intervalId = setInterval(() => {
    $now.set(Date.now());
  }, 1000);

  return () => {
    clearInterval(intervalId);
  };
});
