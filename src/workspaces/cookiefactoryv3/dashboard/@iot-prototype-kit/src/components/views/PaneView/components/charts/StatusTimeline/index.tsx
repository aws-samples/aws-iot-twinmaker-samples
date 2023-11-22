// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { format } from 'date-fns';
import * as echarts from 'echarts';
import parse from 'parse-duration';
import { useEffect, useMemo, useRef, useCallback } from 'react';

import { type ComponentProps } from '@iot-prototype-kit/core/utils/element';
import { isNumber, isString, takeRight } from '@iot-prototype-kit/core/utils/lang2';
import type { DataStream, DurationViewport, Primitive } from '@iot-prototype-kit/types';

import styles from './styles.module.scss';

export function StatusTimeline({
  children,
  className,
  dataStream,
  label,
  legend = [],
  selectColor,
  unit,
  viewport = { duration: '1m' },
  ...props
}: ComponentProps<{
  dataStream: DataStream<Primitive>;
  label: string;
  legend?: { color: string; label: string }[];
  selectColor: (y: Primitive) => string;
  unit?: string;
  viewport?: DurationViewport;
}>) {
  const durationRef = useRef<number>(isString(viewport.duration) ? parse(viewport.duration) ?? 0 : viewport.duration);
  const instance = useRef<echarts.ECharts | null>(null);

  const chartRef = useCallback((el: HTMLElement | null) => {
    if (!el) {
      instance.current?.dispose();
      instance.current = null;
      return;
    }

    instance.current = echarts.init(el);

    const options: echarts.EChartsOption = {
      grid: {
        bottom: 0,
        left: 30,
        right: 0,
        top: 0,
        containLabel: true,
        backgroundColor: 'rgb(255,255,255,.15)',
        borderWidth: 0,
        show: true
      },

      xAxis: {
        max: 'dataMax',
        min: ({ max, min }) => {
          return isNumber(min) && isNumber(max) ? Math.max(min, max - durationRef.current) : min;
        },
        axisLabel: {
          color: `#ddd`,
          fontSize: 12,
          fontWeight: 'bold',
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
        type: 'time'
      },

      yAxis: {
        show: false,
        data: ['status'],
        axisLabel: {
          show: false
        }
      }
    };

    instance.current.setOption(options);
  }, []);

  useEffect(() => {
    const data = dataStream.data;

    instance.current?.setOption({
      series: [
        {
          type: 'custom',
          animation: false,
          emphasis: {
            disabled: true
          },
          renderItem,
          encode: {
            x: [1, 2],
            y: 0
          },
          data: data.map<echarts.SeriesOption>(({ x, y }, index) => {
            let nextValue = x;
            let prevItem = data[index - 1];
            let nextItem = data[index + 1];
            let duration = 0;

            let cursor = index;

            while (nextItem) {
              if (prevItem?.y === y) {
                break;
              }

              nextValue = nextItem.x;
              duration = nextItem.x;

              if (nextItem?.y !== y) {
                break;
              }

              cursor++;
              nextItem = data[cursor];
            }

            return {
              itemStyle: {
                color: selectColor(y)
              },
              value: [index, x, nextValue, duration]
            };
          })
        }
      ]
    });
  }, [dataStream]);

  const latestValue = useMemo(() => takeRight(dataStream.data, 1)[0]?.y ?? '—', [dataStream]);

  return (
    <main className={styles.root} {...props}>
      <section data-head>
        <div data-label>{label}</div>
        <div data-latest-value>
          <div data-value data-alarm={latestValue}>
            {latestValue}
          </div>
        </div>
      </section>
      <section data-chart ref={chartRef}></section>
      {legend.length > 0 && (
        <section data-legend>
          {legend.map(({ color, label }) => (
            <div data-legend-item key={label}>
              <div data-legend-color style={{ backgroundColor: color }}></div>
              <div data-legend-label>{label}</div>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}

const renderItem: echarts.CustomSeriesRenderItem = (params, api) => {
  var start = api.coord([api.value(1), 0]);
  var end = api.coord([api.value(2), 0]);
  var height = api.size ? (api.size([0, 0]) as number[])[1] : 1;

  var rectShape = echarts.graphic.clipRectByRect(
    {
      x: start[0],
      y: start[1] - height / 2,
      width: end[0] - start[0],
      height: height
    },
    {
      /* @ts-ignore */
      x: params.coordSys.x,
      /* @ts-ignore */
      y: params.coordSys.y,
      /* @ts-ignore */
      width: params.coordSys.width,
      /* @ts-ignore */
      height: params.coordSys.height
    }
  );

  return (
    rectShape && {
      type: 'rect',
      transition: ['shape'],
      shape: rectShape,
      style: api.style()
    }
  );
};
