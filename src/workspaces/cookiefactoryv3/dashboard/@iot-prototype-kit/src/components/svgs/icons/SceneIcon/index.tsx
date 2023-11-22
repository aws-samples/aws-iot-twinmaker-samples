// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { createClassName, type ComponentProps } from '@iot-prototype-kit/core/utils/element';

import baseStyles from '../styles.module.css';

export function SceneIcon({ children, className, ...props }: ComponentProps) {
  return (
    <svg className={createClassName(baseStyles.svg, className)} viewBox="0 0 600 693" {...props}>
      <path d="m300 0 300 173.205v346.41L300 692.82 0 519.615v-346.41L300 0ZM66.666 246.334v234.791l200 115.469v-234.79l-200-115.47Zm466.667.002-200 115.469v234.789l200-115.469v-234.79ZM300 76.98 103.333 190.526 300 304.07l196.667-113.545L300 76.98Z" />
    </svg>
  );
}
