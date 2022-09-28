// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2022
// SPDX-License-Identifier: Apache-2.0

import { AmbientLight } from '../../components/light/ambient_light';
import { LightNode } from './light';

export class AmbientLightNode extends LightNode {
  private ambientLight: AmbientLight;
  constructor(name: string) {
    super(name);
    this.ambientLight = new AmbientLight();
    this.addComponent(this.ambientLight);
  }

  public setColor(color: number): void {
    this.ambientLight.color = color;
  }

  public setIntensity(intensity: number): void {
    this.ambientLight.intensity = intensity;
  }
}
