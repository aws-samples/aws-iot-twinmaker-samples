// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2022
// SPDX-License-Identifier: Apache-2.0

import { MotionIndicatorShape } from '../utils/types';
import { DataBinding } from '../node/tag/data_binding';
import { Component } from './component';

export class MotionIndicator extends Component {
  shape: MotionIndicatorShape;
  valueDataBindings: MotionIndicatorDataBindings;
  config: MotionIndicatorConfiguration;

  constructor() {
    super();
    this.type = 'MotionIndicator';
    this.shape = 'LinearCylinder';
    this.valueDataBindings = new MotionIndicatorDataBindings();
    this.config = new MotionIndicatorConfiguration();
  }

  public setShape(shape: MotionIndicatorShape): MotionIndicator {
    this.shape = shape;
    return this;
  }

  public setDefaultSpeed(speed: number): MotionIndicator {
    this.config.defaultSpeed = speed;
    return this;
  }

  public setNumOfRepeatInY(numOfRepeatInY: number): MotionIndicator {
    this.config.numOfRepeatInY = numOfRepeatInY;
    return this;
  }

  public setBackgroundColorOpacity(backgroundColorOpacity: number): MotionIndicator {
    this.config.backgroundColorOpacity = backgroundColorOpacity;
    return this;
  }

  public setDefaultForegroundColor(foregroundColor: number): MotionIndicator {
    this.config.defaultForegroundColor = foregroundColor;
    return this;
  }

  public setSpeedValueDataBinding(dataBinding: DataBinding): MotionIndicator {
    this.valueDataBindings.speed.valueDataBinding = dataBinding;
    return this;
  }

  public setSpeedRuleId(ruleId: string): MotionIndicator {
    this.valueDataBindings.speed.ruleBasedMapId = ruleId;
    return this;
  }

  public setForeGroundColorValueDataBinding(dataBinding: DataBinding): MotionIndicator {
    this.valueDataBindings.foregroundColor.valueDataBinding = dataBinding;
    return this;
  }

  public setForeGroundColorRuleId(ruleId: string): MotionIndicator {
    this.valueDataBindings.foregroundColor.ruleBasedMapId = ruleId;
    return this;
  }
}

class MotionIndicatorDataBindings {
  speed: MotionIndicatorDataBinding;
  foregroundColor: MotionIndicatorDataBinding;
  constructor() {
    this.speed = new MotionIndicatorDataBinding();
    this.foregroundColor = new MotionIndicatorDataBinding();
  }
}

class MotionIndicatorDataBinding {
  valueDataBinding: DataBinding;
  ruleBasedMapId: string;
}

class MotionIndicatorConfiguration {
  numOfRepeatInY: number;
  backgroundColorOpacity: number;
  defaultForegroundColor: number;
  defaultSpeed: number;

  constructor() {
    this.numOfRepeatInY = 3;
    this.backgroundColorOpacity = 0xffffff;
    this.defaultForegroundColor = 0xff00ff;
    this.defaultSpeed = 1;
  }
}
