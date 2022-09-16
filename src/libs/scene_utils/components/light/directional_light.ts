import { Light } from './light';
import { DIRECTIONAL_LIGHT } from './light_type';

export class DirectionalLight extends Light {
  public readonly lightType: string = DIRECTIONAL_LIGHT;
}
