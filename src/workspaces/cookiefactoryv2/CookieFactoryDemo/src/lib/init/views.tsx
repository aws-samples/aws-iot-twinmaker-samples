// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { PanelView } from '@/lib/components/views/PanelView';
import type { View, ViewId } from '@/lib/types';

export const VIEWS: Record<ViewId, View> = {
  panel: {
    content: <PanelView />,
    id: 'panel'
  }
};
