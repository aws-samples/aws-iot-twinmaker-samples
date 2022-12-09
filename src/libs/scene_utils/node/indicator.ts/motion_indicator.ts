// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2022
// SPDX-License-Identifier: Apache-2.0

import { MotionIndicatorShape } from '../../utils/types';
import { MotionIndicator } from '../../components/motion_indicator_component';
import { SceneNode } from '../scene_node';
import { DataBinding } from '../tag/data_binding';

export class MotionIndicatorNode extends SceneNode {
  private motionIndicator: MotionIndicator;
  constructor(name: string) {
    super(name);
    this.motionIndicator = new MotionIndicator();
    this.addComponent(this.motionIndicator);
  }

  public setMotionIndicatorShape(motionIndicatorShape: MotionIndicatorShape): MotionIndicatorNode {
    this.motionIndicator.setShape(motionIndicatorShape);
    return this;
  }

  public setMotionDefaultSpeed(speed: number): MotionIndicatorNode {
    this.motionIndicator.setDefaultSpeed(speed);
    return this;
  }

  public setNumOfRepeatInY(numOfRepeatInY: number): MotionIndicatorNode {
    this.motionIndicator.setNumOfRepeatInY(numOfRepeatInY);
    return this;
  }

  public setBackgroundColorOpacity(backgroundColorOpacity: number): MotionIndicatorNode {
    this.motionIndicator.setBackgroundColorOpacity(backgroundColorOpacity);
    return this;
  }

  public setDefaultForegroundColor(foregroundColor: number): MotionIndicatorNode {
    this.motionIndicator.setDefaultForegroundColor(foregroundColor);
    return this;
  }

  public setSpeedValueDataBinding(dataBinding: DataBinding): MotionIndicatorNode {
    this.motionIndicator.setSpeedValueDataBinding(dataBinding);
    return this;
  }

  public setSpeedRuleId(ruleId: string): MotionIndicatorNode {
    this.motionIndicator.setSpeedRuleId(ruleId);
    return this;
  }

  public setForeGroundColorValueDataBinding(dataBinding: DataBinding): MotionIndicatorNode {
    this.motionIndicator.setForeGroundColorValueDataBinding(dataBinding);
    return this;
  }

  public setForeGroundColorRuleId(ruleId: string): MotionIndicatorNode {
    this.motionIndicator.setForeGroundColorRuleId(ruleId);
    return this;
  }
}
