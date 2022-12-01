// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2022
// SPDX-License-Identifier: Apache-2.0

import { ComponentType } from '../components/component_type';
import { SceneNode } from '../node/scene_node';
import { DistanceUnit, EnvironmentPreset, Rule } from '../utils/types';

export interface IotTwinMakerScene {
  /**
   * Set the scene distance unit.
   * @param distanceUnit
   */
  setUnit(distanceUnit: DistanceUnit): void;

  /**
   * Add scene rules to the scene so that it can be used
   * by dataBinding.
   * @param rules
   */
  addRules(rules: Map<string, Rule>): void;

  /**
   * Add scene rule to the scene so that it can be used
   * by dataBinding.
   * @param rule
   */
  addRule(ruleId: string, rule: Rule): void;

  /**
   * Set the scene environment preset.
   * @param environmentPreset
   */
  setEnviromentPreset(environmentPreset: EnvironmentPreset): void;

  /**
   * Add root node to the scene regardless of the existence of the same node name.
   * @param node
   */
  addRootNode(node: SceneNode): void;

  /**
   * Find the all root nodes with the name.
   * @param name
   */
  findRootNodesByName(name: string): SceneNode[];

  /**
   * Find the all nodes with the name in the node tree.
   * @param name
   */
  findAllNodesByName(name: string): SceneNode[];

  /**
   * Add the root node if there is no root node with the same name.
   * @param node
   */
  addRootNodeIfNameNotExist(node: SceneNode): void;

  /**
   * Return all the nodes with the specific component type in
   * the scene tree.
   */
  findAllNodesByType(type: ComponentType): SceneNode[];

  /**
   * Return the root nodes with the specific component type in
   * the scene tree.
   */
  findRootNodesByType(type: ComponentType): SceneNode[];

  /**
   * Return the workspaceId of the current scene resides
   */
  getWorkspaceId(): string;

  /**
   * Return the sceneId of the current scene.
   */
  getSceneId(): string;

  /**
   * check if the validity of the scene, (i.e. is the nodes hierarchy a tree)
   */
  selfCheck(): void;

  /**
   * Delete the specific node, return true when deleted,
   * else return false.
   */
  deleteNode(node: SceneNode): boolean;

  /**
   * Clear all nodes of in the node tree.
   */
  clear(): void;
}
