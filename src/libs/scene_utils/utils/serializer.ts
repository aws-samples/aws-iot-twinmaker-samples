// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2022
// SPDX-License-Identifier: Apache-2.0

import { ModelRef } from '../components/model_ref_component';
import { ModelShader } from '../components/model_shader_component';
import { MotionIndicator } from '../components/motion_indicator_component';
import { Tag } from '../components/tag_component';
import { ERROR_ICON, INFO_ICON, VIDEO_ICON, WARNING_ICON } from '../const/icon';
import { RED_COLOR, GREEN_COLOR, YELLOW_COLOR } from '../const/color';
import { SceneNode } from '../node/scene_node';
import { IotTwinMakerSceneImpl } from '../scene/iot_twin_maker_scene_impl';
import { NavLink, Rule, Target, Transform, Vector3 } from '../utils/types';
import {
  LIGHT_TYPE,
  MODEL_REF_TYPE,
  MODEL_SHADER_TYPE,
  MOTION_INDICATOR_TYPE,
  TAG_TYPE,
} from '../components/component_type';
import { Component } from '../components/component';

export class Serializer {
  public serializeScene(scene: IotTwinMakerSceneImpl): string {
    const map: Map<SceneNode, number> = new Map<SceneNode, number>();

    this.getNodeIndexMap(map, scene.getRootNodes(), 0);

    const sceneJson = {
      version: IotTwinMakerSceneImpl.version,
      specVersion: IotTwinMakerSceneImpl.specVersion,
      unit: scene.getUnit(),
      properties: scene.getProperties(),
      nodes: this.serializeNodes(scene.getRootNodes(), map, scene.getWorkspaceBucketName()),
      rootNodeIndexes: this.getNodeIndexes(scene.getRootNodes(), map),
      rules: this.serializeRules(scene.getRules()),
    };

    return JSON.stringify(sceneJson, null, 2);
  }

  private serializeRules(rules: Map<string, Rule>) {
    const obj = new Object();
    rules.forEach((value, key) => {
      obj[key] = this.serializeRule(value);
    });

    return obj;
  }

  private serializeMap(map: Map<string, any> | undefined): any {
    if (!map) {
      return {};
    }

    const obj = new Object();
    map.forEach((value, key) => {
      obj[key] = value;
    });

    return obj;
  }

  private serializeRule(rule: Rule): Object {
    const obj = new Object();
    const statements: any[] = [];
    rule.getStatements().forEach((statement) => {
      statements.push({
        expression: statement.getExpression(),
        target: this.serializeTarget(statement.getTarget()),
      });
    });
    obj['statements'] = statements;
    return obj;
  }

  private serializeTarget(target: Target) {
    if (target === Target.ERROR) {
      return ERROR_ICON;
    } else if (target === Target.INFO) {
      return INFO_ICON;
    } else if (target === Target.VIDEO) {
      return VIDEO_ICON;
    } else if (target === Target.WARNING) {
      return WARNING_ICON;
    } else if (target === Target.RED) {
      return RED_COLOR;
    } else if (target === Target.GREEN) {
      return GREEN_COLOR;
    } else if (target === Target.YELLOW) {
      return YELLOW_COLOR;
    } else {
      return undefined;
    }
  }

  private getNodeIndexes(nodes: SceneNode[], map: Map<SceneNode, number>): number[] {
    if (!nodes) {
      return [];
    }

    const indexes: any[] = [];

    for (const node of nodes) {
      indexes.push(map.get(node));
    }

    return indexes;
  }

  private getNodeIndexMap(map: Map<SceneNode, number>, nodes: SceneNode[], startIndex: number): number {
    if (!nodes || nodes.length == 0) {
      return startIndex;
    }
    for (const node of nodes) {
      map.set(node, startIndex);
      startIndex = this.getNodeIndexMap(map, node.getChildrenNodes(), startIndex + 1);
    }
    return startIndex;
  }

  private serializeNodes(rootNodes: SceneNode[], map: Map<SceneNode, number>, bucketName: string): any[] {
    if (!rootNodes || rootNodes.length == 0) {
      return [];
    }

    const serializedNodes: any[] = [];

    for (const node of rootNodes) {
      serializedNodes.push(this.serializeNode(node, map, bucketName));
      const serializedChildrenNodes = this.serializeNodes(node.getChildrenNodes(), map, bucketName);
      for (const childNode of serializedChildrenNodes) {
        serializedNodes.push(childNode);
      }
    }
    return serializedNodes;
  }

  private serializeNode(node: SceneNode, map: Map<SceneNode, number>, bucketName: string): any {
    const nodeJson = {
      name: node.name,
      transform: this.serializeTransform(node.getTransform()),
      transformConstraint: Object.fromEntries(node.getTransformContraint()),
      components: this.serializeComponents(node.getComponents(), bucketName),
      children: this.getNodeIndexes(node.getChildrenNodes(), map),
      properties: {},
    };
    return nodeJson;
  }

  private serializeTransform(transform: Transform): any {
    return {
      position: this.serializeVec3(transform.getPosition()),
      rotation: this.serializeVec3(transform.getRotation()),
      scale: this.serializeVec3(transform.getScale()),
    };
  }

  private serializeVec3(vector3: Vector3): number[] {
    const vec: number[] = [];

    vec.push(vector3.x);
    vec.push(vector3.y);
    vec.push(vector3.z);
    return vec;
  }

  private serializeComponents(components: Component[], bucketName: string) {
    const serializedComponents: any[] = [];

    for (const component of components) {
      if (component.type === MODEL_REF_TYPE) {
        const modelRef: ModelRef = component as ModelRef;
        serializedComponents.push({
          type: MODEL_REF_TYPE,
          uri: `s3://${bucketName}/${modelRef.modelFileName}`,
          modelType: modelRef.modelType,
          unitOfMeasure: modelRef.unitOfMeasure,
        });
      } else if (component.type === MOTION_INDICATOR_TYPE) {
        const motionIndicator: MotionIndicator = component as MotionIndicator;
        serializedComponents.push({
          type: component.type,
          shape: motionIndicator.shape,
          valueDataBindings: motionIndicator.valueDataBindings,
          config: motionIndicator.config,
        });
      } else if (component.type === MODEL_SHADER_TYPE) {
        const modelShader: ModelShader = component as ModelShader;
        serializedComponents.push({
          type: component.type,
          valueDataBinding: modelShader.valueDataBinding,
          ruleBasedMapId: modelShader.ruleBasedMapId,
        });
      } else if (component.type === TAG_TYPE) {
        const tag: Tag = component as Tag;
        serializedComponents.push({
          type: component.type,
          icon: this.serializeTarget(tag.target),
          ruleBasedMapId: tag.ruleBasedMapId,
          valueDataBinding: tag.valueDataBinding,
          navLink: this.serializeNavLink(tag.navLink),
        });
      } else if (component.type === LIGHT_TYPE) {
        const lightType = component['lightType'];
        serializedComponents.push({
          type: component.type,
          lightType: lightType,
          lightSettings: {
            color: component['color'],
            intensity: component['intensity'],
            groundColor: component['groundColor'],
          },
        });
      } else {
        throw new Error(`Unrecognized component: ${component.type}`);
      }
    }
    return serializedComponents;
  }

  private serializeNavLink(navLink: NavLink): any {
    if (!navLink) {
      return {};
    }
    return {
      destination: navLink.destination,
      params: this.serializeMap(navLink.params),
    };
  }
}
