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
