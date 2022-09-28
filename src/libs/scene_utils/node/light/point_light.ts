// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2022
// SPDX-License-Identifier: Apache-2.0

import { PointLight } from '../../components/light/point_light';
import { LightNode } from './light';

export class PointLightNode extends LightNode {
  private pointLight: PointLight;
  constructor(name: string) {
    super(name);
    this.pointLight = new PointLight();
    this.addComponent(this.pointLight);
  }

  public setColor(color: number): void {
    this.pointLight.color = color;
  }

  public setIntensity(intensity: number): void {
    this.pointLight.intensity = intensity;
  }
}
