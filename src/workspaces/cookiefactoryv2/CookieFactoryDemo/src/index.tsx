// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { createRoot } from 'react-dom/client';

import { ALARM_COLORS, CHART_COLORS } from '@/config/project';
import { injectCssVars } from '@/lib/core/utils/styles';
import { App } from '@/App';

const element = document.getElementById('root');

if (element) {
  injectCssVars(ALARM_COLORS, 'color-alarm-');
  injectCssVars(
    Object.entries(CHART_COLORS).reduce<Record<string, string>>((accum, [key, item]) => {
      accum[key] = item.color;
      return accum;
    }, {}),
    'color-chart-'
  );

  createRoot(element).render(<App />);
}
