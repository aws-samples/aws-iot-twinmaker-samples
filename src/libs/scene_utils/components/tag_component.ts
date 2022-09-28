// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2022
// SPDX-License-Identifier: Apache-2.0

import { DataBinding } from '../node/tag/data_binding';
import { NavLink, Target } from '../utils/types';
import { Component } from './component';

export class Tag extends Component {
  target: Target;
  navLink: NavLink;
  ruleBasedMapId: string;
  valueDataBinding: DataBinding;

  constructor() {
    super();
    this.type = 'Tag';
    this.target = Target.EMPTY;
  }

  public setTarget(target: Target): void {
    this.target = target;
  }

  public setRuleId(ruleId: string) {
    this.ruleBasedMapId = ruleId;
  }

  public setDataBinding(dataBinding: DataBinding): void {
    this.valueDataBinding = dataBinding;
  }

  public setNavLink(navLink: NavLink): void {
    this.navLink = navLink;
  }
}
