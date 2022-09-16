import { LightNode } from './light';
import { HemisphereLight } from '../../components/light/hemisphere_light';

export class HemisphereLightNode extends LightNode {
  private hemisphereLight: HemisphereLight;
  constructor(name: string) {
    super(name);
    this.hemisphereLight = new HemisphereLight();
    this.addComponent(this.hemisphereLight);
  }

  public setColor(color: number): void {
    this.hemisphereLight.color = color;
  }

  public setIntensity(intensity: number): void {
    this.hemisphereLight.intensity = intensity;
  }

  public setGroudColor(color: number): void {
    this.hemisphereLight.groundColor = color;
  }
}
