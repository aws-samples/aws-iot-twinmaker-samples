import { Light } from './light';
import { HEMISPHERE_LIGHT } from './light_type';

export class HemisphereLight extends Light {
  public readonly lightType: string = HEMISPHERE_LIGHT;
  groundColor: number;
}
