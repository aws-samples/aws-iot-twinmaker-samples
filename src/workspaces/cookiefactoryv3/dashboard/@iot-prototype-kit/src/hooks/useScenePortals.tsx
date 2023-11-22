// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { useStore } from '@iot-prototype-kit/core/store';
import { findAncestor } from '@iot-prototype-kit/core/utils/element';
import { debounce, isEmpty } from '@iot-prototype-kit/core/utils/lang2';
import { $entities, $selectedEntity, resetSelectedEntity, setSelectedEntity } from '@iot-prototype-kit/stores/entity';

const ORIGIN_ID = 'scene-portals';

export type SceneOverlayRenderCallback = (props: SceneOverlayRenderCallbackProps) => ReactElement | null;
export type SceneOverlayRenderCallbackProps = { entityId: string; isObscured: boolean };

export function useScenePortals({
  overlayRenderCallback,
  overlaySelector = '.tm-html-wrapper'
}: {
  overlayRenderCallback: SceneOverlayRenderCallback;
  overlaySelector?: string;
}) {
  const selectedEntity = useStore($selectedEntity);
  const [overlays, setOverlays] = useState<Record<string, { element: HTMLElement; content: HTMLElement }>>({});
  const portalsContainerRef = useRef<HTMLDivElement>(null);
  const pointerTarget = useRef<HTMLElement | null>(null);

  const handlePointerDown = useCallback((event: PointerEvent) => {
    pointerTarget.current = findAncestor(event.target as HTMLElement | null, (el) => !isEmpty(el.dataset['overlay']));
  }, []);

  const handlePointerUp = useCallback(
    (event: PointerEvent) => {
      if (isEmpty(pointerTarget.current)) return;

      const target = findAncestor(event.target as HTMLElement | null, (el) => !isEmpty(el.dataset['overlay']));

      if (pointerTarget.current == target) {
        if (target) {
          const entityId = target.dataset['entityId'];

          if (entityId) {
            const entity = $entities.get()[entityId];

            if (selectedEntity.entity?.entityId === entityId) {
              resetSelectedEntity();
            } else {
              setSelectedEntity(entity, ORIGIN_ID);
            }
          }
        }
      }

      pointerTarget.current = null;
    },
    [selectedEntity]
  );

  const portals = useMemo(() => {
    return Object.entries(overlays).reduce<ReactNode[]>((accum, [entityId, overlay]) => {
      const content = overlayRenderCallback!({
        entityId,
        isObscured: overlay.element.dataset['overlayObscured'] === 'true'
      });

      if (content) {
        accum.push(
          <Portal
            content={content}
            entityId={entityId}
            key={entityId}
            isSelected={selectedEntity.entity?.entityId === entityId}
            overlay={overlay}
          />
        );
      }

      return accum;
    }, []);
  }, [overlayRenderCallback, overlays, selectedEntity]);

  useEffect(() => {
    let sceneLoadObserver: MutationObserver | null = null;
    let overlayOverlapObserver: MutationObserver | null = null;

    if (portalsContainerRef.current) {
      sceneLoadObserver = new MutationObserver(
        debounce((mutationList) => {
          if (portalsContainerRef.current) {
            for (const mutation of mutationList) {
              if (mutation.type === 'childList' && mutation.addedNodes.length) {
                const elements = portalsContainerRef.current.querySelectorAll<HTMLElement>(overlaySelector);

                if (elements.length) {
                  setOverlays((state) => {
                    const newTargets = [...elements].reduce<
                      Record<string, { element: HTMLElement; content: HTMLElement }>
                    >((accum, element) => {
                      const parent = element.parentElement as HTMLElement | null;
                      const content = element.firstElementChild as HTMLElement | null;

                      if (parent && content) {
                        const text = content.innerText;

                        if (text && text.startsWith('{{')) {
                          const entityId = text.substring(2, text.length - 2);

                          if (content && isEmpty(accum[entityId])) accum[entityId] = { element: parent, content };
                        }
                      }

                      return accum;
                    }, {});

                    if (Object.keys(newTargets).length) return { ...state, ...newTargets };

                    return state;
                  });
                }

                hideOverlaps(portalsContainerRef.current);
              }
            }
          }
        }, 1000)
      );

      overlayOverlapObserver = new MutationObserver(
        debounce(() => {
          requestAnimationFrame(() => {
            if (portalsContainerRef.current) {
              hideOverlaps(portalsContainerRef.current);
              setOverlays((state) => {
                return { ...state };
              });
            }
          });
        }, 100)
      );

      sceneLoadObserver.observe(portalsContainerRef.current, { childList: true, subtree: true });
      overlayOverlapObserver.observe(portalsContainerRef.current, { attributeFilter: ['style'], subtree: true });

      portalsContainerRef.current.addEventListener('pointerdown', handlePointerDown);
      portalsContainerRef.current.addEventListener('pointerup', handlePointerUp);
    }

    return () => {
      sceneLoadObserver?.disconnect();
      overlayOverlapObserver?.disconnect();

      portalsContainerRef.current?.removeEventListener('pointerdown', handlePointerDown);
      portalsContainerRef.current?.removeEventListener('pointerup', handlePointerUp);
    };
  }, [portalsContainerRef.current]);

  return { portals, portalsContainerRef };
}

/**
 * Enables **replacing** target node content with React portal.
 * Based on https://stackoverflow.com/a/74572756
 */
function Portal({
  content,
  entityId,
  isSelected,
  overlay
}: {
  content: ReactNode;
  entityId: string;
  isSelected: boolean;
  overlay: {
    element: HTMLElement;
    content: HTMLElement;
  };
}) {
  const hasMounted = useRef(false);

  // Add entity id and delete existing content on mount only
  if (!hasMounted.current) {
    overlay.element.dataset['overlay'] = entityId;
    overlay.element.dataset['entityId'] = entityId;
    overlay.content.dataset['overlayContent'] = entityId;
    overlay.content.innerHTML = '';
    hasMounted.current = true;
  }

  overlay.element.dataset['overlayActive'] = `${isSelected}`;

  return createPortal(content, overlay.content);
}

function hideOverlaps(ref: HTMLElement) {
  const overlays = ref.querySelectorAll<HTMLElement>('[data-overlay]:not([data-overlay-active=true])');

  overlays.forEach((el) => (el.dataset['overlayObscured'] = 'false'));

  const sorted = [...overlays].sort((a, b) => {
    return parseInt(a.style.zIndex) < parseInt(b.style.zIndex) ? 1 : -1;
  });

  sorted.forEach((item, index) => {
    const a = item.querySelector<HTMLElement>('[data-overlay-content]');

    if (a) {
      sorted.forEach((i, idx) => {
        if (idx <= index || i === item || i.dataset['overlayObscured'] === 'true') return;

        const b = i.querySelector<HTMLElement>('[data-overlay-content]');

        if (b) {
          i.dataset['overlayObscured'] = isOverlapping(a, b) + '';
        }
      });
    }
  });
}

function isOverlapping(a: HTMLElement, b: HTMLElement) {
  const rectA = a.getBoundingClientRect();
  const rectB = b.getBoundingClientRect();

  return !(
    rectA.top > rectB.bottom ||
    rectA.bottom < rectB.top ||
    rectA.left > rectB.right ||
    rectA.right < rectB.left
  );
}
