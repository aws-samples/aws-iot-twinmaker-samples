import { Light } from './light';
import { POINT_LIGHT } from './light_type';

export class PointLight extends Light {
  public readonly lightType: string = POINT_LIGHT;
}
