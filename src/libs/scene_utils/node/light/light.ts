// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2022
// SPDX-License-Identifier: Apache-2.0

import { SceneNode } from '../scene_node';

export abstract class LightNode extends SceneNode {
  protected color: number;
  protected intensity: number;

  constructor(name: string) {
    super(name);
    this.color = 0xffffff;
    this.intensity = 1.0;
  }

  protected abstract setColor(color: number): void;

  protected abstract setIntensity(intensity: number): void;
}
