import { DataBinding } from '../node/tag/data_binding';
import { Component } from './component';

export class ModelShader extends Component {
  valueDataBinding: DataBinding;
  ruleBasedMapId: string;

  constructor() {
    super();
    this.type = 'ModelShader';
  }
  public withValueDataBinding(dataBinding: DataBinding): ModelShader {
    this.valueDataBinding = dataBinding;
    return this;
  }

  public withRuleId(ruleId: string): ModelShader {
    this.ruleBasedMapId = ruleId;
    return this;
  }
}
