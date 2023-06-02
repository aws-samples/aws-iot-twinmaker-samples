// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import type { Core, EdgeSingular, NodeSingular } from '../graph';

export function isNode(cy: Core, value: Core | EdgeSingular | NodeSingular): value is NodeSingular {
  if (value === cy) {
    return false;
  } else {
    return (value as EdgeSingular | NodeSingular).isNode();
  }
}
