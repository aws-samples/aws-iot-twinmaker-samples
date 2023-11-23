// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

export const DEFAULT_QUERY_HOPS = 0;

export const QUERY_ALL_EQUIPMENT_AND_PROCESS_STEPS = `
  SELECT processStep, r1, e, r2, equipment
  FROM EntityGraph
  MATCH (cookieLine)<-[:isChildOf]-(processStepParent)<-[:isChildOf]-(processStep)-[r1]-(e)-[r2]-(equipment), equipment.components AS c
  WHERE cookieLine.entityName = 'COOKIE_LINE'
  AND processStepParent.entityName = 'PROCESS_STEP'
  AND c.componentTypeId = 'com.example.cookiefactory.equipment'`;

export function createQueryByEquipment(entityId: string, hops = DEFAULT_QUERY_HOPS) {
  const normalizedHops = Math.max(0, hops);
  let selectString = '';
  let matchString = '';

  for (let i = 0; i <= normalizedHops; i++) {
    selectString += `, r${i}, e${i}`;
    matchString += `-[r${i}]-(e${i})`;
  }

  return `
    SELECT processStep${selectString}
    FROM EntityGraph
    MATCH (cookieLine)<-[:isChildOf]-(processStepParent)<-[:isChildOf]-(processStep)${matchString}
    WHERE cookieLine.entityName = 'COOKIE_LINE'
    AND processStepParent.entityName = 'PROCESS_STEP'
    AND r${normalizedHops}.relationshipName != 'isChildOf'
    AND e0.entityId = '${entityId}'`;
}

export function createQueryByProcessStep(entityId: string, hops = DEFAULT_QUERY_HOPS) {
  const normalizedHops = Math.max(0, hops);
  let selectString = '';
  let matchString = '';

  for (let i = 0; i < normalizedHops; i++) {
    selectString += `, r${i}, e${i}`;
    matchString += `-[r${i}]-(e${i})`;
  }

  return `
    SELECT processStep${selectString}
    FROM EntityGraph
    MATCH (cookieLine)<-[:isChildOf]-(processStepParent)<-[:isChildOf]-(processStep)${matchString}
    WHERE cookieLine.entityName = 'COOKIE_LINE'
    AND processStepParent.entityName = 'PROCESS_STEP'
    AND processStep.entityId = '${entityId}'`;
}
