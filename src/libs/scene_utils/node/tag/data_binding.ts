// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2022
// SPDX-License-Identifier: Apache-2.0

import { isEmptyString } from '../../utils/string_utils';

export class DataBinding {
  private dataBindingContext: DataBindingContext;

  constructor() {
    this.dataBindingContext = new DataBindingContext();
  }

  public withTargetEntityId(entityId: string): DataBinding {
    this.dataBindingContext.withTargetEntityId(entityId);
    return this;
  }

  public withTargetComponentName(componentName: string): DataBinding {
    this.dataBindingContext.withTargetComponentName(componentName);
    return this;
  }

  public withTargetProperty(propertyName: string): DataBinding {
    this.dataBindingContext.withTargetProperty(propertyName);
    return this;
  }

  public withEntityPath(entityPath: string): DataBinding {
    this.dataBindingContext.withEntityPath(entityPath);
    return this;
  }
}

class DataBindingContext {
  entityId: string;
  componentName: string;
  propertyName: string;
  entityPath: string;

  public withTargetEntityId(entityId: string): DataBindingContext {
    this.entityId = entityId;
    return this;
  }

  public withTargetComponentName(componentName: string): DataBindingContext {
    if (isEmptyString(this.entityId)) {
      throw new Error('ComponentName cannot be set without target entity');
    }

    this.componentName = componentName;
    return this;
  }

  public withTargetProperty(propertyName: string): DataBindingContext {
    if (isEmptyString(this.entityId) || isEmptyString(this.componentName)) {
      throw new Error('Property cannot be set without target entity or component name');
    }

    this.propertyName = propertyName;
    return this;
  }

  public withEntityPath(entityPath: string) {
    this.entityPath = entityPath;
  }
}
