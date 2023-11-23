// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

export function createQueryFor(...entityId: string[]) {
  let whereClause = 'WHERE ';

  entityId.forEach((id, index) => {
    if (index === 0) {
      whereClause += `entity.entityId = '${id}'`;
    } else {
      whereClause += ` OR entity.entityId = '${id}'`;
    }
  });

  return `
    SELECT entity
    FROM EntityGraph MATCH (entity)
    ${whereClause}
  `;
}

export function createQueryForDescendantNodesOf(entityId: string) {
  return `
    SELECT root, e
    FROM EntityGraph MATCH (root)<-{1,}(e)
    WHERE root.entityId = '${entityId}'
  `;
}

export function createQueryForDescendantNodesAndEdgesOf(entityId: string) {
  return `
    SELECT root, r1, e1, r2, e2
    FROM EntityGraph MATCH (root)<-[r1]-(e1)-[r2]-(e2)
    WHERE root.entityId = '${entityId}'
  `;
}
