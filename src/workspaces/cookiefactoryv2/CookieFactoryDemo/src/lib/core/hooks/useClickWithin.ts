// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import { useState, useEffect, useRef } from 'react';

/**
 * https://stackoverflow.com/a/45323523
 */
export function useClickWithin(initialIsVisible: boolean) {
  const [isClickWithin, setClickWithin] = useState(initialIsVisible);
  const ref = useRef<HTMLElement>(null);

  function handlePointerDown({ target }: MouseEvent) {
    if (ref.current && target && !ref.current.contains(target as HTMLElement)) {
      setClickWithin(false);
    }
  }

  useEffect(() => {
    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, []);

  return { ref, isClickWithin, setClickWithin };
}
