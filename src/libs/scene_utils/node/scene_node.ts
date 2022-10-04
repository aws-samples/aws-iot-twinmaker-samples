// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2022
// SPDX-License-Identifier: Apache-2.0

import { Transform, Vector3 } from '../utils/types';
import { ModelShader } from '../components/model_shader_component';
import { ComponentType } from '../components/component_type';
import { Component } from '../components/component';

export class SceneNode {
  name: string;
  private transform: Transform;
  private transformConstraint: Map<string, any>;
  private components: Component[];
  childrenNodes: SceneNode[];
  private properties: Map<string, any>;

  constructor(name: string) {
    this.name = name;
    this.transform = new Transform();
    this.transformConstraint = new Map<string, any>();
    this.components = [];
    this.childrenNodes = [];
    this.properties = new Map<string, any>();
  }

  /**
   *
   * @internal
   */
  public getTransform(): Transform {
    return this.transform;
  }

  /**
   * @internal
   */
  public getTransformContraint(): Map<string, any> {
    return this.transformConstraint;
  }

  /**
   * @internal
   */
  public getComponents(): Component[] {
    return this.components;
  }

  public withRotation(rotation: Vector3): SceneNode {
    this.transform.setRotation(rotation);
    return this;
  }

  public addComponent(component: Component): SceneNode {
    if (this.containsNonModelShaderComponent() && component.type != 'ModelShader') {
      throw new Error('Except for model shader component, this node contains more than one other type of component');
    }

    this.components.push(component);
    return this;
  }

  private containsNonModelShaderComponent(): boolean {
    for (let component of this.components) {
      if (component.type != 'ModelShader') {
        return true;
      }
    }
    return false;
  }

  public withPosition(position: Vector3): SceneNode {
    this.transform.setPosition(position);
    return this;
  }

  public withScale(scale: Vector3): SceneNode {
    this.transform.setScale(scale);
    return this;
  }

  public setSnapToFloor(snapToFloor: boolean): SceneNode {
    this.transformConstraint.set('snapToFloor', snapToFloor);
    return this;
  }

  public addModelShader(modelShader: ModelShader): SceneNode {
    this.components.push(modelShader);
    return this;
  }
  public getChildrenNodes(): SceneNode[] {
    return this.childrenNodes;
  }

  public addChildNode(node: SceneNode): void {
    this.childrenNodes.push(node);
  }

  public findChildNodesByName(name: string): SceneNode[] {
    const targetNodes: SceneNode[] = [];

    for (const node of this.childrenNodes) {
      if (node.name === name) {
        targetNodes.push(node);
      }
    }
    return targetNodes;
  }

  public findChildNodesByType(type: ComponentType): SceneNode[] {
    const targetNodes: SceneNode[] = [];

    for (const node of this.childrenNodes) {
      for (const component of node.components) {
        if (component.type === type) {
          targetNodes.push(node);
        }
      }
    }
    return targetNodes;
  }

  public findAllNodesByName(name: string): SceneNode[] {
    let targetNodes: SceneNode[] = [];

    if (this.name === name) {
      targetNodes.push(this);
    }

    for (const node of this.childrenNodes) {
      if (node.name === name) {
        targetNodes.push(node);
      }
      for (const childNode of node.childrenNodes) {
        targetNodes = targetNodes.concat(childNode.findAllNodesByName(name));
      }
    }
    return targetNodes;
  }

  public findAllNodesByType(type: ComponentType): SceneNode[] {
    let targetNodes: SceneNode[] = [];

    for (const component of this.components) {
      if (component.type === type) {
        targetNodes.push(this);
        break;
      }
    }

    for (const node of this.childrenNodes) {
      for (const component of node.components) {
        if (component.type === type) {
          targetNodes.push(node);
          break;
        }
      }
      for (const childNode of node.childrenNodes) {
        targetNodes = targetNodes.concat(childNode.findAllNodesByType(type));
      }
    }
    return targetNodes;
  }

  public addChildNodeIfNameNotExist(node: SceneNode): void {
    let sameNameNodeExists: Boolean = false;

    for (const existingNode of this.childrenNodes) {
      if (node.name === existingNode.name) {
        sameNameNodeExists = true;
        break;
      }
    }

    if (!sameNameNodeExists) {
      this.addChildNode(node);
    }
  }

  public deleteNode(node: SceneNode): boolean {
    for (let i = 0; i < this.childrenNodes.length; i++) {
      if (node == this.childrenNodes[i]) {
        this.childrenNodes.slice(i, 1);
        return true;
      }
      if (this.childrenNodes[i].deleteNode(node)) {
        return true;
      }
    }
    return false;
  }

  public clearAllChildrenNodes(): void {
    this.childrenNodes = [];
  }
}
