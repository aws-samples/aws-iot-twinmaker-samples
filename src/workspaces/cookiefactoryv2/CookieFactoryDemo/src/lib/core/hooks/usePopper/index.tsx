// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useMemo, useRef, useState, useEffect, type ReactNode } from 'react';

import { createClassName } from '../../utils/element';
import { isNotNil } from '../../utils/lang';

import styles from './styles.module.css';

export type BoundingBox = { height: number; width: number; x: number; y: number };
export type Placement = (typeof placements)[number];

const placements = ['top', 'right', 'bottom', 'left'] as const;

export function usePopper({
  content,
  offset = 0,
  placement = 'top',
  targetBoundingBox: bb
}: {
  content?: ReactNode;
  offset?: number;
  placement?: Placement;
  targetBoundingBox?: BoundingBox;
}) {
  const [children, setChildren] = useState<ReactNode>(content);
  const [isVisible, setIsVisible] = useState(false);
  const animationFrameRef = useRef(0);
  const overlayRef = useRef<HTMLElement | null>(null);
  const offsetRef = useRef(offset);
  const placementRef = useRef(placement);
  const targetBoundingBox = useRef(bb);

  // public api

  const overlay = useMemo(() => {
    return (
      <main className={createClassName(styles.root, { [styles.isVisible]: isVisible })} ref={overlayRef}>
        {children}
      </main>
    );
  }, [children, isVisible]);

  const updateContent = useCallback((content: ReactNode) => {
    setChildren(content);
  }, []);

  const updateOffset = useCallback((offset: number) => {
    offsetRef.current = offset;
  }, []);

  const updatePlacement = useCallback((placement: Placement) => {
    placementRef.current = placement;
  }, []);

  const updateTargetBoundingBox = useCallback((boundingBox: BoundingBox) => {
    setBoundingBox(boundingBox);
  }, []);

  const show = useCallback((visibleOrTargetBoundingBox: Boolean | BoundingBox = true) => {
    setIsVisible((state) => {
      if (!state && isBoundingBox(visibleOrTargetBoundingBox)) {
        setBoundingBox(visibleOrTargetBoundingBox);
      }
      return !!visibleOrTargetBoundingBox;
    });
  }, []);

  const toggle = useCallback(
    (targetBoundingBox?: BoundingBox) => {
      isVisible ? setIsVisible(false) : show(targetBoundingBox);
    },
    [isVisible]
  );

  // private

  const setBoundingBox = useCallback((boundingBox: BoundingBox) => {
    targetBoundingBox.current = boundingBox;

    animationFrameRef.current = requestAnimationFrame(() => {
      if (overlayRef.current && targetBoundingBox.current) {
        const { height, width, x, y } = targetBoundingBox.current;
        let left = 0;
        let top = 0;

        switch (placementRef.current) {
          case 'top': {
            left = x + width / 2;
            top = y;
            break;
          }
          case 'bottom': {
            left = x + width / 2;
            top = y + height;
            break;
          }
          case 'left': {
            left = x;
            top = y + height / 2;
            break;
          }
          case 'right': {
            left = x + width;
            top = y + height / 2;
            break;
          }
        }

        overlayRef.current.setAttribute('style', `--gap: ${offsetRef.current}rem; left:${left}px; top:${top}px`);
        overlayRef.current.classList.remove(...placements.map((layout) => styles[layout]));
        overlayRef.current.classList.add(styles[placementRef.current]);
      }
    });
  }, []);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  return {
    overlay,
    show,
    toggle,
    updateContent,
    updateOffset,
    updatePlacement,
    updateTargetBoundingBox
  };
}

function isBoundingBox(value: any): value is BoundingBox {
  return isNotNil(value.height) && isNotNil(value.width) && isNotNil(value.x) && isNotNil(value.y);
}
