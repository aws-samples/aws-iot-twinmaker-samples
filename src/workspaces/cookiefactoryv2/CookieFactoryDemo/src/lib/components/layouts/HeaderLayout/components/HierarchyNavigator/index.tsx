// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import { useMemo } from 'react';
import type { ValueOf } from 'type-fest';

import { ArrowRightIcon, GlobeIcon } from '@/lib/components/svgs/icons';
import { useSummaryState, useSelectedState } from '@/lib/state/entity';
import { useSiteState } from '@/lib/state/site';
import { isNil } from '@/lib/utils/lang';
import { createClassName, type ClassName } from '@/lib/utils/element';
import type { EntitySummary } from '@/lib/types';

import styles from './styles.module.css';

const UNKNOWN_ENTITY_NAME = 'UNKNOWN ENTITY';

export function HierarchyNavigator({ className }: { className?: ClassName }) {
  const [entitySummaries] = useSummaryState();
  const [{ entityData }] = useSelectedState();
  const [site, setSite] = useSiteState();

  const contentElement = useMemo(() => {
    if (entitySummaries && site) {
      const parents = walkParentEntities(entitySummaries, entityData?.entityId);

      return (
        <>
          <button className={styles.icon} onPointerDown={() => setSite(null)}>
            <GlobeIcon />
          </button>

          <span className={styles.seperator}>
            <ArrowRightIcon />
          </span>

          <span className={createClassName(styles.label, { [styles.active]: isNil(entityData) })}>{site.name}</span>

          {parents.length > 0 && parents.map((parent) => <Crumb key={parent.entityId} name={parent.entityName} />)}
          {entityData && (
            <Crumb
              key={entityData.entityId}
              isActive={true}
              name={entitySummaries[entityData.entityId]?.entityName ?? UNKNOWN_ENTITY_NAME}
            />
          )}
        </>
      );
    }

    return null;
  }, [entitySummaries, entityData, site]);

  return <section className={createClassName(styles.root, className)}>{contentElement}</section>;
}

function Crumb({ isActive = false, name }: { isActive?: boolean; name: string }) {
  return (
    <>
      <span className={styles.seperator}>
        <ArrowRightIcon />
      </span>
      <span className={createClassName(styles.label, { [styles.active]: isActive })}>{name}</span>
    </>
  );
}

function walkParentEntities(entities: ReturnType<typeof useSummaryState>[0], selectedEntityId?: string) {
  let parents: { entityId: string; entityName: string }[] = [];
  if (selectedEntityId) {
    let parentEntityId = entities[selectedEntityId]?.parentEntityId;
    while (parentEntityId) {
      const selectedEntity = entities[parentEntityId];
      if (selectedEntity?.entityId && selectedEntity?.entityName)
        parents.unshift({ entityId: selectedEntity.entityId, entityName: selectedEntity.entityName });
      parentEntityId = selectedEntity?.parentEntityId;
    }
  }
  return parents;
}
