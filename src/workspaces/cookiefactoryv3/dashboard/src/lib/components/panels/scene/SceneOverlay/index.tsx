/* Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023 */
/* SPDX-License-Identifier: Apache-2.0 */

import { useEffect, useMemo, useRef } from 'react';

import { MiniKpiChart } from '@iot-prototype-kit/components/charts/MiniKpiChart';
import { AlarmHighIcon, AlarmLowIcon, AlarmMediumIcon } from '@iot-prototype-kit/components/svgs/icons/AlarmIcons';
import { CloseIcon } from '@iot-prototype-kit/components/svgs/icons/CloseIcon';
import type { SceneOverlayRenderCallbackProps } from '@iot-prototype-kit/hooks/useScenePortals';
import { takeRight } from '@iot-prototype-kit/core/utils/lang2';
import { useStore } from '@iot-prototype-kit/core/store';
import { compareStrings } from '@iot-prototype-kit/core/utils/string';
import { $alarmValues, $dataStreams, $entitiesLatestValues } from '@iot-prototype-kit/stores/data';
import { $entities, $selectedEntity, resetSelectedEntity } from '@iot-prototype-kit/stores/entity';
import { getAlarmByValue } from '@iot-prototype-kit/utils/data';
import type { DataStreamMetaData } from '@iot-prototype-kit/types';

import { Sparkline } from '@/lib/components/charts/Sparkline';
import {
  AlarmMarkerNueue0,
  AlarmMarkerNueue1,
  AlarmMarkerNueue2,
  AlarmMarkerNueue3
} from '@/lib/components/panels/scene/icons/alarms/alarmMarkers';
import type { AppAlarmState } from '@/lib/types';

import styles from './styles.module.scss';
import { createClassName } from '@iot-prototype-kit/core/utils/element';

export function SceneOverlay({ entityId, isObscured }: SceneOverlayRenderCallbackProps) {
  const alarmValues = useStore($alarmValues);
  const entities = useStore($entities);
  const entitiesLatestValues = useStore($entitiesLatestValues);
  const selectedEntity = useStore($selectedEntity);
  const ref = useRef<HTMLElement>(null);
  const entity = entities[entityId];

  const alarmValue = alarmValues[entityId];
  const isSelected = selectedEntity.entity?.entityId === entityId;
  const latestValues = entitiesLatestValues[entityId];
  let alarmState = getAlarmByValue<AppAlarmState>(alarmValue?.dataPoint.y) ?? 'unknown';

  const hasAlarm = alarmState !== 'unknown' && alarmState !== 'normal' && alarmState !== 'running';

  const content = useMemo(() => {
    if (isSelected) {
      return (
        <>
          <section data-body data-selected>
            <section data-name>
              <span>{entity.metadata.displayName}</span>
              <button data-close-button onPointerUp={resetSelectedEntity}>
                <CloseIcon data-close-icon />
              </button>
            </section>
            {latestValues ? (
              <section data-kpis>
                {Object.values(latestValues)
                  .sort((a, b) => compareStrings(a.displayName, b.displayName))
                  .map((latestValue, index) => {
                    let sparklineData: number[] = [];

                    for (const { data, meta } of $dataStreams.get()) {
                      if (meta) {
                        const { entityId, propertyName } = meta as DataStreamMetaData;
                        const entity = entities[entityId];

                        if (
                          entity.entityId === selectedEntity.entity?.entityId &&
                          propertyName === latestValue.metaData.propertyName
                        ) {
                          sparklineData = takeRight(data, 40).map<number>((point) => point.y as number);
                        }
                      }
                    }

                    return (
                      <section key={latestValue.metaData.entityId + latestValue.metaData.propertyName} data-kpi>
                        <MiniKpiChart alarmValue={alarmValue} className={styles.kpi} latestValue={latestValue} />
                        <Sparkline data={sparklineData} data-sparkline data-index={index} />
                      </section>
                    );
                  })}
              </section>
            ) : (
              <section data-empty-state>No data available</section>
            )}
            <section data-bottom>
              <AlarmMarker alarmState={alarmState} />
            </section>
          </section>
        </>
      );
    }

    if (hasAlarm) {
      return (
        <section data-body data-unselected-alarm>
          <AlarmMarker alarmState={alarmState} />
        </section>
      );
    }

    return (
      <section data-body data-unselected>
        <AlarmMarkerNueue0 data-tag />
      </section>
    );
  }, [alarmState, entities, isSelected, latestValues, selectedEntity]);

  useEffect(() => {
    function handlePointerEvent(ev: MouseEvent) {
      if (isSelected && ev.target instanceof HTMLButtonElement === false) ev.stopPropagation();
    }

    ref.current?.addEventListener('click', handlePointerEvent);

    return () => {
      ref.current?.removeEventListener('click', handlePointerEvent);
    };
  }, [isSelected]);

  if (!entity) return null;

  return (
    <main
      className={createClassName(styles.root, styles[alarmState])}
      data-has-alarm={hasAlarm}
      data-is-selected={isSelected}
      data-is-obscured={isObscured}
      ref={ref}
    >
      {content}
    </main>
  );
}

function AlarmIcon({ alarmState }: { alarmState: AppAlarmState }) {
  return useMemo(() => {
    switch (alarmState) {
      case 'down': {
        return <AlarmHighIcon data-alarm-icon />;
      }
      case 'blocked': {
        return <AlarmMediumIcon data-alarm-icon />;
      }
      case 'starved': {
        return <AlarmLowIcon data-alarm-icon />;
      }
      default: {
        return null;
      }
    }
  }, [alarmState]);
}

function AlarmMarker({ alarmState }: { alarmState: AppAlarmState }) {
  return useMemo(() => {
    switch (alarmState) {
      case 'down': {
        return <AlarmMarkerNueue1 data-tag data-alarm-high />;
      }
      case 'blocked': {
        return <AlarmMarkerNueue2 data-tag data-alarm-medium />;
      }
      case 'starved': {
        return <AlarmMarkerNueue3 data-tag data-alarm-low />;
      }
      default: {
        return <AlarmMarkerNueue0 data-tag />;
      }
    }
  }, [alarmState]);
}
