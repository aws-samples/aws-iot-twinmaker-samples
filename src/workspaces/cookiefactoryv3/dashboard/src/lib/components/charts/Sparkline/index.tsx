// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { createClassName, type ComponentProps } from '@iot-prototype-kit/core/utils/element';

import styles from './styles.module.scss';

export function Sparkline({
  baseline = 0,
  children,
  className,
  data,
  ...props
}: ComponentProps<{ baseline?: number; data: number[] }>) {
  const [min, max] = data.reduce(
    (accum, value) => {
      accum[0] = accum[0] < value ? accum[0] : value;
      accum[1] = accum[1] > value ? accum[1] : value;
      return accum;
    },
    [baseline, baseline]
  );
  const points = data.map((value, index) => `${index === 0 ? 'M' : 'L'} ${index} ${value} `);

  return (
    <svg
      className={createClassName(styles.svg, className)}
      viewBox={`0 ${min} ${data.length} ${Math.abs(max - min) || 1}`}
      preserveAspectRatio="none"
      {...props}
    >
      <path data-axis d={`M 0 ${baseline} L ${data.length} ${baseline} Z`} vectorEffect="non-scaling-stroke" />
      {/* <path
        d="M 0 14 L 1 15 L 2 10 L 3 11 L 4 7 L 5 5 L 6 0 L 7 5 L 8 10 L 9 11 L 9 15 L 0 15 Z"
        stroke="transparent"
        fill="pink"
      /> */}
      <path data-plot d={points.join('').trim()} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
