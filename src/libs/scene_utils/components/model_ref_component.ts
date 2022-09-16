import { DistanceUnit, ModelType } from '../utils/types';
import { Component } from './component';

export class ModelRef extends Component {
  modelFileName: string;
  modelType: ModelType;
  unitOfMeasure: DistanceUnit;
  castShadow: boolean;
  receiveShadow: boolean;
  constructor() {
    super();
    this.type = 'ModelRef';
  }
}
