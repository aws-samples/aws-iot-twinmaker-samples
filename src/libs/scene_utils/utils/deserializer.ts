// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2022
// SPDX-License-Identifier: Apache-2.0

import { ModelRef } from '../components/model_ref_component';
import { ModelShader } from '../components/model_shader_component';
import { MotionIndicator } from '../components/motion_indicator_component';
import { Tag } from '../components/tag_component';
import { ERROR_ICON, INFO_ICON, VIDEO_ICON, WARNING_ICON } from '../const/icon';
import {
  DataBindingConfig,
  FieldMapping,
  IotTwinMakerSceneImpl,
  SceneProperties,
  Template,
} from '../scene/iot_twin_maker_scene_impl';
import { SceneNode } from '../node/scene_node';
import { DataBinding } from '../node/tag/data_binding';
import { NavLink, Target, Vector3, Rule, Statement } from '../utils/types';
import { parse } from 'path';
import { HemisphereLight } from '../components/light/hemisphere_light';
import { AmbientLight } from '../components/light/ambient_light';
import { DirectionalLight } from '../components/light/directional_light';
import { PointLight } from '../components/light/point_light';
import { SceneFactoryImpl } from '../factory/scene_factory_impl';
import {
  LIGHT_TYPE,
  MODEL_REF_TYPE,
  MODEL_SHADER_TYPE,
  MOTION_INDICATOR_TYPE,
  TAG_TYPE,
} from '../components/component_type';
import { AMBIENT_LIGHT, DIRECTIONAL_LIGHT, HEMISPHERE_LIGHT } from '../components/light/light_type';
import { Component } from '../components/component';

export class Deserializer {
  public async deserializeScene(
    workspaceId: string,
    sceneId: string,
    sceneContent: string,
  ): Promise<IotTwinMakerSceneImpl> {
    const sceneJson = JSON.parse(JSON.parse(sceneContent));
    const specVersion = sceneJson['specVersion'];
    const version = sceneJson['version'];

    if (specVersion != IotTwinMakerSceneImpl.specVersion || version != IotTwinMakerSceneImpl.version) {
      throw new Error(
        'Cannot deserialize the scene since the specVersion or version do not match. ' +
          'expected specVersion: ' +
          IotTwinMakerSceneImpl.specVersion +
          ' expected version: ' +
          IotTwinMakerSceneImpl.version +
          ' but actual specVersion: ' +
          specVersion +
          ' version: ' +
          version,
      );
    }

    const unit = sceneJson['unit'];
    const properties = this.deserializeProperties(sceneJson['properties']);
    const rootNodeIndexes = sceneJson['rootNodeIndexes'];
    const nodes = this.deserializeNodes(sceneJson['nodes'] as JSON[], rootNodeIndexes);
    const rules = this.deserializeRules(sceneJson['rules']);

    const twinMakerScene = await new SceneFactoryImpl().createLocalEmptyScene(workspaceId, sceneId);

    twinMakerScene.setNodes(nodes);
    twinMakerScene.addRules(rules);
    twinMakerScene.setProperties(properties);
    twinMakerScene.setRootNodeIndexes(rootNodeIndexes);
    twinMakerScene.setUnit(unit);
    return twinMakerScene;
  }

  private deserializeRules(rulesJson: JSON): Map<string, Rule> {
    const rules: Map<string, Rule> = new Map<string, Rule>();
    if (!rulesJson) {
      return rules;
    }

    for (let key in rulesJson) {
      rules.set(key, this.deserializeRule(rulesJson[key]));
    }
    return rules;
  }

  private deserializeRule(ruleJson: JSON): Rule {
    const statementsJson = ruleJson['statements'];
    const statements: Statement[] = [];
    if (statementsJson) {
      const statementsJsonArray = statementsJson as JSON[];
      for (let statement of statementsJsonArray) {
        statements.push(new Statement(statement['expression'], statement['target']));
      }
    }
    const rule = new Rule();
    rule.addStatements(statements);
    return rule;
  }

  private deserializeNodes(nodesJson: JSON[], rootNodeIndexes: number[]): SceneNode[] {
    if (!nodesJson) {
      return [];
    }
    const nodes: SceneNode[] = [];
    for (let index of rootNodeIndexes) {
      nodes.push(this.deserializeNode(nodesJson[index], nodesJson));
    }
    return nodes;
  }

  private deserializeNode(nodeJson: JSON, nodesJson: JSON[]): SceneNode {
    const name = nodeJson['name'];
    const sceneNode: SceneNode = new SceneNode(name);
    const transformJson = nodeJson['transform'];
    sceneNode
      .withPosition(this.deserializeVec3(transformJson['position']))
      .withRotation(this.deserializeVec3(transformJson['rotation']))
      .withScale(this.deserializeVec3(transformJson['scale']));
    const transformConstraint = sceneNode['transformConstraint'];
    if (transformConstraint && transformConstraint['snapToFloor']) {
      sceneNode.setSnapToFloor(true);
    }
    const children: number[] = nodeJson['children'];

    if (children && children.length > 0) {
      for (let childIndex of children) {
        sceneNode.addChildNode(this.deserializeNode(nodesJson[childIndex], nodesJson));
      }
    }

    const componentsJson = nodeJson['components'] as JSON[];

    for (let componentJson of componentsJson) {
      const type = componentJson['type'] as string;

      if (type === TAG_TYPE) {
        sceneNode.addComponent(this.deserializeTagComponent(componentJson));
      } else if (type === MODEL_REF_TYPE) {
        sceneNode.addComponent(this.deserializeModelRef(componentJson));
      } else if (type === MOTION_INDICATOR_TYPE) {
        sceneNode.addComponent(this.deserializeMotionIndicator(componentJson));
      } else if (type === LIGHT_TYPE) {
        sceneNode.addComponent(this.deserializeLightComponent(componentJson));
      } else if (type === MODEL_SHADER_TYPE) {
        sceneNode.addModelShader(this.deserializeModelShader(componentJson));
      }
    }

    return sceneNode;
  }

  private deserializeLightComponent(lightComponentJson: JSON): Component {
    const lightType = lightComponentJson['lightType'];
    const lightSettings = lightComponentJson['lightSettings'];
    if (lightType === HEMISPHERE_LIGHT) {
      const light = new HemisphereLight();
      if (lightSettings) {
        light.color = lightSettings['color'];
        light.groundColor = lightSettings['groundColor'];
        light.intensity = lightSettings['intensity'];
      }
      return light;
    } else if (lightType === AMBIENT_LIGHT) {
      const light = new AmbientLight();
      if (lightSettings) {
        light.color = lightSettings['color'];
        light.intensity = lightSettings['intensity'];
      }
      return light;
    } else if (lightType === DIRECTIONAL_LIGHT) {
      const light = new DirectionalLight();
      if (lightSettings) {
        light.color = lightSettings['color'];
        light.intensity = lightSettings['intensity'];
      }
      return light;
    } else {
      const light = new PointLight();
      if (lightSettings) {
        light.color = lightSettings['color'];
        light.intensity = lightSettings['intensity'];
      }
      return light;
    }
  }

  private deserializeModelShader(modelShaderJson: JSON): ModelShader {
    const modelShader = new ModelShader();
    const dataBinding = modelShaderJson['valueDataBinding'];
    const ruleBasedMapId = modelShaderJson['ruleBasedMapId'];

    modelShader.withValueDataBinding(this.deserializeDataBinding(dataBinding));
    modelShader.withRuleId(ruleBasedMapId);
    return modelShader;
  }

  private deserializeMotionIndicator(indicatorJson: JSON): MotionIndicator {
    const motionIndicator: MotionIndicator = new MotionIndicator();
    motionIndicator.setShape(indicatorJson['shape']);
    const valueBindings = indicatorJson['valueDataBindings'];
    const config = indicatorJson['config'];

    if (valueBindings) {
      const foreGroundColorBinding = valueBindings['foregroundColor'];
      const speedBinding = valueBindings['speed'];
      motionIndicator.setForeGroundColorValueDataBinding(this.deserializeDataBinding(foreGroundColorBinding));

      if (foreGroundColorBinding) {
        motionIndicator.setForeGroundColorRuleId(foreGroundColorBinding['ruleBasedMapId']);
      }

      motionIndicator.setSpeedValueDataBinding(this.deserializeDataBinding(speedBinding));

      if (speedBinding) {
        motionIndicator.setSpeedRuleId(speedBinding['ruleBasedMapId']);
      }
    }

    if (config) {
      const numOfRepeatInY = config['numOfRepeatInY'];
      const backgroundColorOpacity = config['backgroundColorOpacity'];
      const defaultSpeed = config['defaultSpeed'];
      if (numOfRepeatInY) {
        motionIndicator.setNumOfRepeatInY(numOfRepeatInY);
      }

      if (backgroundColorOpacity) {
        motionIndicator.setBackgroundColorOpacity(backgroundColorOpacity);
      }

      if (defaultSpeed) {
        motionIndicator.setDefaultSpeed(defaultSpeed);
      }
    }

    return motionIndicator;
  }

  private deserializeModelRef(modelRefJson: JSON): ModelRef {
    const modelRef = new ModelRef();
    const uri: string = modelRefJson['uri'];
    const unitOfMeasure = modelRefJson['unitOfMeasure'];
    if (uri) {
      if (modelRefJson['modelType'] === 'Tiles3D') {
        modelRef.modelFileName = this.deserializeTiles3DUri(uri);
      } else {
        modelRef.modelFileName = parse(uri).base;
      }
    }

    modelRef.modelType = modelRefJson['modelType'];
    if (unitOfMeasure) {
      modelRef.unitOfMeasure = unitOfMeasure;
    }
    modelRef.castShadow = modelRefJson['castShadow'];
    modelRef.receiveShadow = modelRefJson['receiveShadow'];
    return modelRef;
  }

  /**
   * Tiles3D model path is a tileset.json within a directory of the bucket. Need the full path from the root of that directory.
   * @param uri example: s3://<BUCKET_NAME>/<Tiles3D_ROOT>/tileset.json
   * @returns <Tiles3D_ROOT>/tileset.json
   */
  private deserializeTiles3DUri(uri: string): string {
    const parsedUri = parse(uri);
    const parsedUriDir = parse(parsedUri.dir);
    const modelFilePath = `${parsedUriDir.base}/${parsedUri.base}`;
    return modelFilePath;
  }

  private deserializeTagComponent(tagJson: JSON): Tag {
    const tag: Tag = new Tag();
    tag.setTarget(this.deserializeIcon(tagJson['icon']));
    tag.setRuleId(tagJson['ruleBasedMapId']);
    tag.setDataBinding(this.deserializeDataBinding(tagJson['valueDataBinding']));
    tag.setNavLink(this.deserializeNavLink(tagJson['navLink']));

    return tag;
  }

  private deserializeNavLink(navLinkJson: JSON): NavLink {
    if (!navLinkJson) {
      return new NavLink();
    }
    return new NavLink()
      .withDestination(navLinkJson['destination'])
      .withParams(this.deserializeToMap(navLinkJson['params']));
  }

  private deserializeDataBinding(dataBindingJson: JSON): DataBinding {
    if (!dataBindingJson) {
      return new DataBinding();
    }
    const dataBinding = new DataBinding();
    const bindingContext = dataBindingJson['dataBindingContext'];

    if (bindingContext) {
      const entityId = bindingContext['entityId'];
      const componentName = bindingContext['componentName'];
      const propertyName = bindingContext['propertyName'];
      const entityPath = bindingContext['entityPath'];
      if (entityId) {
        dataBinding.withTargetEntityId(entityId);
      }
      if (componentName) {
        dataBinding.withTargetComponentName(componentName);
      }
      if (propertyName) {
        dataBinding.withTargetProperty(propertyName);
      }

      if (entityPath) {
        dataBinding.withEntityPath(entityPath);
      }
    }
    return dataBinding;
  }

  private deserializeIcon(icon: string): Target {
    if (icon === INFO_ICON) {
      return Target.INFO;
    } else if (icon === WARNING_ICON) {
      return Target.WARNING;
    } else if (icon === ERROR_ICON) {
      return Target.ERROR;
    } else if (icon === VIDEO_ICON) {
      return Target.VIDEO;
    } else {
      return Target.EMPTY;
    }
  }

  private deserializeToMap(json: JSON): Map<string, any> {
    const map = new Map<string, any>();
    for (let key in json) {
      map.set(key, json[key]);
    }
    return map;
  }

  private deserializeVec3(vector: number[]): Vector3 {
    return {
      x: vector[0],
      y: vector[1],
      z: vector[2],
    };
  }

  private deserializeProperties(propertiesJson: JSON): SceneProperties {
    if (!propertiesJson) {
      return {};
    }
    let properties: SceneProperties = {
      environmentPreset: propertiesJson['environmentPreset'],
    };

    // Don't add dataBindingConfig property if no content
    const dataBindingConfig = propertiesJson['dataBindingConfig'];
    if (!!dataBindingConfig) {
      properties = {
        ...properties,
        dataBindingConfig: this.deserializeSceneDataBindingConfig(propertiesJson['dataBindingConfig']),
      }
    }

    return properties;
  }

  private deserializeSceneDataBindingConfig(sceneDataBindingConfig: JSON): DataBindingConfig {
    if (!sceneDataBindingConfig) {
      return {};
    }
    return {
      fieldMapping: this.deserializeFieldMapping[sceneDataBindingConfig['fieldMapping']],
      template: this.deserializeTemplate(sceneDataBindingConfig['template']),
    };
  }

  private deserializeFieldMapping(fieldMapping: JSON): FieldMapping {
    if (!fieldMapping) {
      return {};
    }
    return {
      entityId: fieldMapping['entityId'],
      componentName: fieldMapping['componentName'],
    };
  }

  private deserializeTemplate(template: JSON): Template {
    if (!template) {
      return {};
    }

    return {
      sel_entity: template['sel_entity'],
      sel_comp: template['sel_comp'],
    };
  }
}
