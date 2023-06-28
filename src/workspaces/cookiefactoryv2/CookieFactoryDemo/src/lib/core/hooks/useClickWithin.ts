// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import React, { useState, useEffect, useRef } from 'react';

type AnyElement<E extends HTMLElement> = E;

/**
 * Credit: https://stackoverflow.com/a/45323523
 */
export function useClickWithin(isVisible: boolean) {
  const [isClickWithin, setClickWithin] = useState(isVisible);
  const ref = useRef<AnyElement<any>>(null);

  function handlePointerUp({ target }: PointerEvent) {
    if (ref.current && target && !ref.current.contains(target as HTMLElement)) {
      setClickWithin(false);
    }
  }

  useEffect(() => {
    document.addEventListener('pointerup', handlePointerUp, true);

    return () => {
      document.removeEventListener('pointerup', handlePointerUp, true);
    };
  }, []);

  return { ref, isClickWithin, setClickWithin };
}
