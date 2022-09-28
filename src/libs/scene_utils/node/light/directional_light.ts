// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2022
// SPDX-License-Identifier: Apache-2.0

import { DirectionalLight } from '../../components/light/directional_light';
import { LightNode } from './light';

export class DirectionalLightNode extends LightNode {
  private directionalLight: DirectionalLight;
  constructor(name: string) {
    super(name);
    this.directionalLight = new DirectionalLight();
    this.addComponent(this.directionalLight);
  }

  public setColor(color: number): void {
    this.directionalLight.color = color;
  }

  public setIntensity(intensity: number): void {
    this.directionalLight.intensity = intensity;
  }
}
