import { Light } from './light';
import { AMBIENT_LIGHT } from './light_type';

export class AmbientLight extends Light {
  public readonly lightType: string = AMBIENT_LIGHT;
}
