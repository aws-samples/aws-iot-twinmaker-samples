// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2022
// SPDX-License-Identifier: Apache-2.0

import { ComponentType } from '../components/component_type';
import { ModelRefNode } from '../node/model.ts/model_ref';
import { SceneNode } from '../node/scene_node';
import { DistanceUnit, EnvironmentPreset, Rule } from '../utils/types';
import { IotTwinMakerScene } from './iot_twin_maker_scene';

export class IotTwinMakerSceneImpl implements IotTwinMakerScene {
  public static readonly specVersion = '1.0';
  public static readonly version = '1';
  private unit: DistanceUnit = 'meters';
  private properties: SceneProperties;
  private rootNodes: SceneNode[];
  private rootNodeIndexes: number[];
  private cameras: string[];
  private rules: Map<string, Rule>;
  private bucketName: string;
  public readonly workspaceId: string;
  public readonly sceneId: string;

  constructor(workspaceId: string, sceneId: string, bucketName: string) {
    this.sceneId = sceneId;
    this.rules = new Map<string, Rule>();
    this.workspaceId = workspaceId;
    this.rootNodes = [];
    this.properties = {};
    this.cameras = [];
    this.rootNodeIndexes = [];
    this.bucketName = bucketName;
  }

  /** @internal */
  setRootNodeIndexes(rootNodeIndexes: number[]): IotTwinMakerSceneImpl {
    this.rootNodeIndexes = rootNodeIndexes;
    return this;
  }

  /** @internal */
  getRootNodes(): SceneNode[] {
    return this.rootNodes;
  }

  /** @internal */
  setProperties(properties: SceneProperties) {
    this.properties = properties;
  }

  /** @internal */
  setNodes(nodes: SceneNode[]): IotTwinMakerSceneImpl {
    this.rootNodes = nodes;
    return this;
  }

  public setUnit(distanceUnit: DistanceUnit): void {
    this.unit = distanceUnit;
  }

  /** @internal */
  getUnit(): DistanceUnit {
    return this.unit;
  }

  /** @internal */
  getProperties(): SceneProperties {
    return this.properties;
  }

  public getWorkspaceId(): string {
    return this.workspaceId;
  }

  public getSceneId(): string {
    return this.sceneId;
  }

  public addRules(rules: Map<string, Rule>): void {
    rules.forEach((value, key) => {
      this.rules.set(key, value);
    });
  }

  public addRule(ruleId: string, rule: Rule): void {
    this.rules.set(ruleId, rule);
  }

  // @internal
  getRules(): Map<string, Rule> {
    return this.rules;
  }

  public setEnviromentPreset(environmentPreset: EnvironmentPreset): void {
    this.properties.environmentPreset = environmentPreset;
  }

  public addRootNode(node: SceneNode): void {
    this.rootNodes.push(node);
  }

  public findRootNodesByName(name: string): SceneNode[] {
    const targetNodes: SceneNode[] = [];

    for (const node of this.rootNodes) {
      if (node.name === name) {
        targetNodes.push(node);
      }
    }
    return targetNodes;
  }

  public findRootNodesByType(type: ComponentType): SceneNode[] {
    const targetNodes: SceneNode[] = [];

    for (const node of this.rootNodes) {
      for (const component of node.getComponents()) {
        if (component.type === type) {
          targetNodes.push(node);
        }
      }
    }
    return targetNodes;
  }

  public findAllNodesByName(name: string): SceneNode[] {
    let targetNodes: SceneNode[] = [];

    for (const node of this.rootNodes) {
      targetNodes = targetNodes.concat(node.findAllNodesByName(name));
    }
    return targetNodes;
  }

  public findAllNodesByType(type: ComponentType): SceneNode[] {
    let targetNodes: SceneNode[] = [];

    for (const node of this.rootNodes) {
      targetNodes = targetNodes.concat(node.findAllNodesByType(type));
    }
    return targetNodes;
  }

  public selfCheck(): void {
    // Check if there is circle
    const seen = new Set<SceneNode>();

    for (const rootNode of this.rootNodes) {
      this.selfCheckInternal(rootNode, seen);
    }
  }

  private selfCheckInternal(node: SceneNode, seen: Set<SceneNode>): void {
    if (seen.has(node)) {
      throw new Error('circle detected in node:' + node.name);
    }
    seen.add(node);
    for (const childNode of node.childrenNodes) {
      this.selfCheckInternal(childNode, seen);
    }
  }

  public addRootNodeIfNameNotExist(node: SceneNode): void {
    let sameNameNodeExists: Boolean = false;

    for (const existingNode of this.rootNodes) {
      if (node.name === existingNode.name) {
        sameNameNodeExists = true;
        break;
      }
    }

    if (!sameNameNodeExists) {
      this.addRootNode(node);
    }
  }

  public getWorkspaceBucketName(): string {
    return this.bucketName;
  }

  public deleteNode(rootNode: SceneNode): boolean {
    for (let i = 0; i < this.rootNodes.length; i++) {
      if (rootNode == this.rootNodes[i]) {
        this.rootNodes.splice(i, 1);
        return true;
      }
      if (this.rootNodes[i].deleteNode(rootNode)) {
        return true;
      }
    }
    return false;
  }

  public clear(): void {
    this.rootNodes = [];
    this.rootNodeIndexes = [];
  }
}

export type SceneProperties = {
  environmentPreset?: EnvironmentPreset;
  dataBindingConfig?: DataBindingConfig;
};

export type DataBindingConfig = {
  fieldMapping?: FieldMapping;
  template?: Template;
};

export type FieldMapping = {
  entityId?: string[];
  componentName?: string[];
};

export type Template = {
  sel_entity?: string;
  sel_comp?: string;
};
