// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2022
// SPDX-License-Identifier: Apache-2.0

import { EntitySummary, ListEntitiesFilter } from 'aws-sdk/clients/iottwinmaker';
import { ModelShader } from '../../components/model_shader_component';
import { SceneFactoryImpl } from '../../factory/scene_factory_impl';
import { EmptyNode } from '../../node/empty_node';
import { MotionIndicatorNode } from '../../node/indicator.ts/motion_indicator';
import { ModelRefNode } from '../../node/model.ts/model_ref';
import { DataBinding } from '../../node/tag/data_binding';
import { TagNode } from '../../node/tag/tag';
import { NavLink, Rule, Statement, Target } from '../../utils/types';
import { assetToModelRef, parseArgs, parseCsv, processMixerTransform } from './sample_utils';

const { workspaceId, sceneId, assetDirPath } = parseArgs();

const factory = new SceneFactoryImpl();

// Create a scene or load an existing scene for updates
factory.loadOrCreateSceneIfNotExists(workspaceId, sceneId).then(async (twinMakerScene) => {
  // Clear scene to fully overwrite it
  twinMakerScene.clear();

  // Add a Root Node to the Scene
  console.log('Building Cookie Factory scene...');
  const rootNode = new EmptyNode('AWSIoTTwinMakerScene');

  // Set the Environmental Preset in the Scene settings
  twinMakerScene.setEnviromentPreset('neutral');

  // Create new Rules with statements - ALARM ICON
  const alarmRuleMap: Rule = new Rule();
  const alarmRuleName = 'AlarmRuleMap';
  const alarmRuleStatement = new Statement('alarm_status == ACTIVE', Target.ERROR);
  alarmRuleMap.addStatement(alarmRuleStatement);

  // Create new Rules with statements - MESH COLOR
  const meshColorRuleMap: Rule = new Rule();
  const meshColorRuleName = 'MeshColorRuleMap';
  const meshColorRuleStatementRed = new Statement('Temperature > 100', Target.RED);
  const meshColorRuleStatementYellow = new Statement('Temperature < 99', Target.YELLOW);
  meshColorRuleMap.addStatement(meshColorRuleStatementRed);
  meshColorRuleMap.addStatement(meshColorRuleStatementYellow);

  // Create new Rules with statements - WATERTANK COLOR
  const waterTankFlowRuleMap: Rule = new Rule();
  const waterTankFlowRuleName = 'WaterTankFlowRuleMap';
  const waterTankFlowRuleRed = new Statement('flowRate1 > 40', Target.RED);
  const waterTankFlowRuleGreen = new Statement('flowRate1 <= 40', Target.GREEN);
  waterTankFlowRuleMap.addStatement(waterTankFlowRuleRed);
  waterTankFlowRuleMap.addStatement(waterTankFlowRuleGreen);

  // Add Rules to the Scene
  twinMakerScene.addRule(alarmRuleName, alarmRuleMap);
  twinMakerScene.addRule(meshColorRuleName, meshColorRuleMap);
  twinMakerScene.addRule(waterTankFlowRuleName, waterTankFlowRuleMap);

  // Add Environment Model
  const environmentAssetFile = `${assetDirPath}CookieFactoryEnvironment.glb`;
  const environmentNode: ModelRefNode = assetToModelRef(environmentAssetFile, 'Environment');
  environmentNode.withCastShadow(true).withReceiveShadow(true);

  // Upload the Asset for 3D Model
  environmentNode.uploadModelFromLocalIfNotExist(environmentAssetFile);

  // Add Node to the Scene
  rootNode.addChildNode(environmentNode);

  // Add Equipment Node
  const equipmentNode = new EmptyNode('Equipment');
  environmentNode.addChildNode(equipmentNode);

  // Add Parent Nodes within Equipment
  const mixersNode = new EmptyNode('Mixers');
  const cookieLinesNode = new EmptyNode('CookieLines');
  equipmentNode.addChildNode(mixersNode);
  equipmentNode.addChildNode(cookieLinesNode);

  // Add Cookie Lines
  console.log('Adding Cookie Lines...');
  const cookieLineAssetFile = `${assetDirPath}CookieFactoryLine.glb`;
  const cookieLineNode: ModelRefNode = assetToModelRef(cookieLineAssetFile, 'COOKIE_LINE');
  cookieLineNode.withCastShadow(true).withReceiveShadow(true);
  const cookieLineNode1: ModelRefNode = assetToModelRef(cookieLineAssetFile, 'COOKIE_LINE_1');
  cookieLineNode1.withCastShadow(true).withReceiveShadow(true);
  const cookieLineNode2: ModelRefNode = assetToModelRef(cookieLineAssetFile, 'COOKIE_LINE_2');
  cookieLineNode2.withCastShadow(true).withReceiveShadow(true);
  cookieLineNode.uploadModelFromLocalIfNotExist(cookieLineAssetFile);

  cookieLineNode.withPosition({ x: 26, y: -2.5, z: 45 });
  cookieLineNode1.withPosition({ x: 9.5, y: -2.5, z: 45 });
  cookieLineNode2.withPosition({ x: -7, y: -2.5, z: 45 });

  cookieLinesNode.addChildNode(cookieLineNode);
  cookieLinesNode.addChildNode(cookieLineNode1);
  cookieLinesNode.addChildNode(cookieLineNode2);

  // Add Mixers with Data Bindings for Entity Alarm Data
  const listEntitiesFilter: ListEntitiesFilter = {
    componentTypeId: 'com.example.cookiefactory.alarm',
  };

  const mixerTransformCsvPath = `${__dirname}/MixerTransform.csv`;
  const csvResult = parseCsv(mixerTransformCsvPath);

  console.log('Adding Mixers and WaterTank...');
  const addModelAndRuleForEntity = (entitySummary: EntitySummary) => {
    if (entitySummary.entityId.includes('Mixer')) {
      // Create an instance of Tag Node
      const tagNode: TagNode = new TagNode('Tag');

      const dataBinding = new DataBinding();

      // Set the Entity ID, Component Name and Property Name in data binding
      dataBinding
        .withTargetEntityId(entitySummary.entityId)
        .withTargetComponentName('AlarmComponent')
        .withTargetProperty('alarm_status');

      // Update the Tag Node with a position and the above data binding and rule
      tagNode
        .withDataBinding(dataBinding)
        .withTarget(Target.INFO)
        .withRuleId(alarmRuleName)
        .withPosition({ x: 0, y: 2.84, z: 0 });

      // Set Nav Link parameters on the tag
      // Expect entity name to be "Mixer_{NUM}"
      const cameraNum = Number(entitySummary.entityName.slice(6)) > 12 ? '1' : '2';
      tagNode.withNavLink(
        new NavLink().withParams(
          new Map([
            ['kvs_stream_name', `cookiefactory_mixerroom_camera_0${cameraNum}`],
            ['sel_entity_name', entitySummary.entityName],
          ]),
        ),
      );

      // Prepare 3D Model
      const mixerAssetFile = `${assetDirPath}CookieFactoryMixer.glb`;
      const modelRefNode: ModelRefNode = assetToModelRef(mixerAssetFile, entitySummary.entityName);
      modelRefNode.withCastShadow(true).withReceiveShadow(true);
      modelRefNode.uploadModelFromLocalIfNotExist(mixerAssetFile);

      // Add Tag to 3D Model node
      modelRefNode.addChildNode(tagNode);

      // Set Mixer Transform
      processMixerTransform(modelRefNode, entitySummary.entityName, csvResult);

      // Add 3D Model to the Scene
      mixersNode.addChildNode(modelRefNode);
    } else if (entitySummary.entityId.includes('WaterTank')) {
      // Prepare Tag
      const tagNode: TagNode = new TagNode('Tag');
      const tagDataBinding = new DataBinding();

      tagDataBinding
        .withTargetEntityId(entitySummary.entityId)
        .withTargetComponentName('AlarmComponent')
        .withTargetProperty('alarm_status');

      // Update the Tag Node with a position and the above data binding and rule
      tagNode
        .withDataBinding(tagDataBinding)
        .withTarget(Target.INFO)
        .withRuleId(alarmRuleName)
        .withPosition({ x: 0, y: 0.86, z: 0 });

      tagNode.withNavLink(new NavLink().withParams(new Map([['sel_entity_name', entitySummary.entityName]])));

      // Prepare 3D Model
      const waterTankAssetFile = `${assetDirPath}CookieFactoryWaterTank.glb`;
      const waterTankNode: ModelRefNode = assetToModelRef(waterTankAssetFile, 'WaterTank');
      waterTankNode.withCastShadow(true).withReceiveShadow(true);
      waterTankNode.uploadModelFromLocalIfNotExist(waterTankAssetFile);

      waterTankNode.withPosition({ x: 32.6, y: 0, z: 47 });
      waterTankNode.addChildNode(tagNode);

      // Create an instance of Motion Indicator node
      const motionIndicator: MotionIndicatorNode = new MotionIndicatorNode('MotionIndicator');

      // Set Motion Indicator features and transform
      motionIndicator
        .setMotionIndicatorShape('LinearPlane')
        .setMotionDefaultSpeed(1)
        .setDefaultForegroundColor(0xffff00) // YELLOW
        .setNumOfRepeatInY(1)
        .withPosition({ x: 1.4, y: 3, z: -3 })
        .withRotation({ x: 0, y: 270, z: 0 })
        .withScale({ x: 7, y: 1, z: 1 });

      waterTankNode.addChildNode(motionIndicator);

      // Create a Model Shader instance with data binding and rule
      const waterTankDataBinding = new DataBinding();
      tagDataBinding
        .withTargetEntityId(entitySummary.entityId)
        .withTargetComponentName('WaterTank')
        .withTargetProperty('flowRate1');

      const modelShader: ModelShader = new ModelShader()
        .withValueDataBinding(waterTankDataBinding)
        .withRuleId(waterTankFlowRuleName);

      waterTankNode.addModelShader(modelShader);
      equipmentNode.addChildNode(waterTankNode);
    }
  };

  await factory.updateSceneForEntities(workspaceId, addModelAndRuleForEntity, [listEntitiesFilter]);

  twinMakerScene.addRootNodeIfNameNotExist(rootNode);

  // Save the changes to the Scene
  await factory.save(twinMakerScene);
});
