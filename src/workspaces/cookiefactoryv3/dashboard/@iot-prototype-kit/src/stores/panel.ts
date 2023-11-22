// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { action, atom, computed } from '@iot-prototype-kit/core/store';
import { resetSelectedEntity } from '@iot-prototype-kit/stores/entity';
import type { PanelConfig } from '@iot-prototype-kit/types';

export const $openPanels = atom(new Set<string>());
export const $panelConfigs = atom<PanelConfig[]>([]);

export const $flexPanels = computed($panelConfigs, (panelConfigs) => {
  return panelConfigs.filter(({ layer }) => layer !== true).map(({ id }) => id);
});

export const $layerPanels = computed($panelConfigs, (panelConfigs) => {
  return panelConfigs.filter(({ layer }) => layer === true).map(({ id }) => id);
});

export const $openFlexPanels = computed([$flexPanels, $openPanels], (flexPanels, openPanels) => {
  return flexPanels.filter((id) => openPanels.has(id));
});

export const $openFlexPanelCount = computed($openFlexPanels, (openFlexPanels) => {
  return openFlexPanels.length;
});

export const $openLayerPanels = computed([$layerPanels, $openPanels], (layerPanels, openPanels) => {
  return layerPanels.filter((id) => openPanels.has(id));
});

export const closePanel = action($openPanels, 'closePanel', ({ get, set }, id: string) => {
  const openPanels = get();
  openPanels.delete(id);
  set(new Set(openPanels));
});

export const expandPanel = action($openPanels, 'expandPanel', ({ get, set }, id: string) => {
  const openPanels = get();
  $flexPanels.get().forEach((id) => openPanels.delete(id));
  openPanels.add(id);
  set(new Set(openPanels));
});

export const openPanel = action($openPanels, 'closePanel', ({ get, set }, id: string, closeOtherPanels = false) => {
  const openPanels = get();

  if (closeOtherPanels) openPanels.clear();
  openPanels.add(id);

  set(new Set(openPanels));
});

export const resetOpenPanels = action($openPanels, 'resetOpenPanels', ({ set }) => set(new Set<string>()));
export const resetPanelConfigs = action($panelConfigs, 'resetPanelConfigs', ({ set }) => set([]));

export const setPanelConfigs = action($panelConfigs, 'setPanelConfigs', ({ set }, panelConfigs: PanelConfig[]) =>
  set([...panelConfigs])
);

export const togglePanel = action($openPanels, 'togglePanel', ({ get, set }, id: string, closeOtherPanels = false) => {
  const openPanels = get();
  const hasId = openPanels.has(id);

  if (closeOtherPanels) {
    const size = openPanels.size;
    openPanels.clear();
    if (!hasId || size > 1) openPanels.add(id);
  } else {
    hasId ? openPanels.delete(id) : openPanels.add(id);
  }

  set(new Set(openPanels));

  return openPanels.has(id);
});

$openPanels.listen((openPanels) => {
  if (openPanels.size === 0) resetSelectedEntity();
});
