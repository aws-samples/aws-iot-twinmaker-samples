// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useRef, type ReactNode } from 'react';

import { $event } from '@iot-prototype-kit/core/graph/events';
import type { NodeSingular } from '@iot-prototype-kit/core/graph/types';
import { isNode } from '@iot-prototype-kit/core/graph/utils';
import { usePopper, type BoundingBox, type Placement } from '@iot-prototype-kit/core/hooks/usePopper';

const OFFSET = 5;
const PLACEMENT: Placement = 'right';

export function Overlay({ content }: { content: (node: NodeSingular) => ReactNode }) {
  const { overlay, show, updateContent, updateOffset, updateTargetBoundingBox } = usePopper({
    offset: OFFSET,
    placement: PLACEMENT
  });
  const nodeRef = useRef<NodeSingular | null>(null);

  useEffect(() => {
    return $event.listen((event) => {
      if (event) {
        const { cy, originalEvent, target, type } = event;

        switch (type) {
          case 'drag':
          case 'viewport': {
            if (nodeRef.current) {
              updateOffset(cy.zoom() * OFFSET);
              updateTargetBoundingBox(getNodeBoundingBox(nodeRef.current));
            }
            break;
          }

          case 'mouseover': {
            if (isNode(cy, target)) {
              updateContent(content(target));
              show(getNodeBoundingBox(target));
              nodeRef.current = target;
            }
            break;
          }

          case 'mouseout': {
            if (originalEvent.buttons === 0) {
              show(false);
              nodeRef.current = null;
            }
          }
        }
      }
    });
  }, []);

  return overlay;
}

function getNodeBoundingBox(node: NodeSingular): BoundingBox {
  const { h, w, x1, y1 } = node.renderedBoundingBox({ includeLabels: false });
  return { height: h, width: w, x: x1, y: y1 };
}
