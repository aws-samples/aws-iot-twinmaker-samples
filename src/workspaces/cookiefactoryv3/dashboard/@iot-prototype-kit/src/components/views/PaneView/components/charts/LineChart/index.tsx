// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { format } from 'date-fns';
import * as echarts from 'echarts';
import parse from 'parse-duration';
import { useEffect, useMemo, useRef, useCallback } from 'react';

import { type ComponentProps } from '@iot-prototype-kit/core/utils/element';
import { isEmpty, isNumber, isString, takeRight } from '@iot-prototype-kit/core/utils/lang2';
import type { DataStream, DataStreamMetaData, DurationViewport, Primitive } from '@iot-prototype-kit/types';

import styles from './styles.module.scss';

export function LineChart({
  children,
  className,
  color,
  dataStream,
  label,
  unit,
  viewport = { duration: '1m' },
  ...props
}: ComponentProps<{
  color: string;
  dataStream: DataStream<Primitive>;
  label: string;
  unit?: string;
  viewport?: DurationViewport;
}>) {
  const durationRef = useRef<number>(isString(viewport.duration) ? parse(viewport.duration) ?? 0 : viewport.duration);
  const instance = useRef<echarts.ECharts | null>(null);

  const lineChartRef = useCallback((el: HTMLElement | null) => {
    if (!el) {
      instance.current?.dispose();
      instance.current = null;
      return;
    }

    instance.current = echarts.init(el);

    const options: echarts.EChartsOption = {
      color,

      grid: {
        bottom: 22,
        left: 30,
        right: 0,
        top: 6
      },

      tooltip: {
        trigger: 'axis',
        position: function (pt) {
          return [pt[0], '10%'];
        }
      },

      xAxis: {
        max: 'dataMax',
        min: ({ max, min }) => {
          return isNumber(min) && isNumber(max) ? Math.max(min, max - durationRef.current) : min;
        },

        axisLabel: {
          color: `#ddd`,
          fontSize: 12,
          fontWeight: 'normal',
          formatter: (value: number) => {
            const formatted = format(value, 'h:mmaaaaa'); // 'MMM dd, yyyy'
            if (formatted === '12:00a') return format(value, 'LLL d');
            return formatted;
          },
          hideOverlap: true
        },
        axisLine: {
          lineStyle: {
            color: `#ddd`,
            width: 1.5
          }
        },
        axisTick: {
          lineStyle: {
            color: `#ddd`,
            width: 1.5
          }
        },
        type: 'time'
      },

      yAxis: {
        axisLabel: {
          color: `#ddd`,
          fontSize: 14,
          fontWeight: 'bold',
          formatter: (value: number) =>
            Intl.NumberFormat('en-US', {
              notation: 'compact',
              maximumFractionDigits: 1
            }).format(value)
        },
        name: '°F',
        splitLine: {
          lineStyle: {
            color: `rgb(255,255,255,.4)`
          }
        },
        type: 'value'
      },

      series: [
        {
          name: 'Fake Data',
          animation: false,
          areaStyle: {
            shadowColor: 'rgba(255, 255, 255 ,.5)',
            shadowBlur: 10
          },
          emphasis: {
            disabled: true
          },
          lineStyle: {
            width: 2.5
          },
          showSymbol: false,
          type: 'line',
          data: []
        }
      ]
    };

    instance.current.setOption(options);
  }, []);

  useEffect(() => {
    const data = dataStream.data.map(({ x, y }) => [x, y]) as number[][];
    const max = data.reduce((a, b) => Math.max(a, b[1]), -Infinity);
    instance.current?.setOption({
      series: [
        {
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: max > 0 ? 0 : 1,
                color: `${color}66`
              },
              {
                offset: max > 0 ? 1 : 0,
                color: `${color}00`
              }
            ])
          },
          name: (dataStream.meta as DataStreamMetaData | undefined)?.propertyName ?? 'Unknown',
          data
        }
      ]
    });
  }, [dataStream]);

  const latestValue = useMemo(() => takeRight(dataStream.data, 1)[0]?.y ?? '-', [dataStream]);

  return (
    <main className={styles.root} {...props}>
      <section data-head>
        <div data-label>{label}</div>
        <div data-latest-value>
          <div data-value>
            {latestValue.toLocaleString(undefined, { maximumFractionDigits: 1, minimumFractionDigits: 1 })}
          </div>
          {!isEmpty(unit) && <div data-unit>{unit}</div>}
        </div>
      </section>
      <section data-chart ref={lineChartRef}></section>
    </main>
  );
}
