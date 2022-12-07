// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2022
// SPDX-License-Identifier: Apache-2.0

import { NavLink, Target } from '../../utils/types';
import { SceneNode } from '../scene_node';
import { DataBinding } from './data_binding';
import { Tag } from '../../components/tag_component';

export class TagNode extends SceneNode {
  private tag: Tag;

  constructor(name: string) {
    super(name);
    this.tag = new Tag();
    this.addComponent(this.tag);
  }

  public withNavLink(navLink: NavLink): TagNode {
    this.tag.setNavLink(navLink);
    return this;
  }

  public withTarget(target: Target): TagNode {
    this.tag.setTarget(target);
    return this;
  }

  public withDataBinding(dataBinding: DataBinding): TagNode {
    this.tag.setDataBinding(dataBinding);
    return this;
  }

  public withRuleId(ruleId: string): TagNode {
    this.tag.setRuleId(ruleId);
    return this;
  }
}
