// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import type { CSSProperties } from 'react';

import { createClassName, type ClassName } from '@/lib/core/utils/element';

import baseStyles from '../styles.module.css';

export function BellDisabledFilledIcon({ className, style }: { className?: ClassName; style?: CSSProperties }) {
  return (
    <svg className={createClassName(baseStyles.svg, className)} style={style} viewBox="0 0 614 668">
      <path d="M415.582 567.334c-8.088 56.538-56.711 99.999-115.485 99.999-58.775 0-107.398-43.461-115.485-99.999h230.97Zm198.322 26.429-47.141 47.141L459.859 534H7l66.667-190.333v-76.334c0-36.098 6.263-70.515 17.617-101.908L.097 74.237l47.14-47.14 75.919 75.92.001-.002 490.747 490.748ZM307 .667a216.664 216.664 0 0 1 51.667 9.666C466.667 35 540.334 150.667 540.334 277v66.667l44.336 126.581-416.949-416.95C205.618 21.048 252.392 1.641 303.138.702L307 .667Z" />
    </svg>
  );
}

export function BellDisabledOutlinedIcon({ className, style }: { className?: ClassName; style?: CSSProperties }) {
  return (
    <svg className={createClassName(baseStyles.svg, className)} style={style} viewBox="0 0 614 668">
      <path d="m613.904 593.763-47.141 47.141-106.904-106.905-19.525.001c0 72.902-58.508 132.138-131.129 133.315l-2.205.018c-72.901 0-132.138-58.507-133.315-131.128l-.018-2.205H7l66.667-190.333v-76.334c0-36.098 6.263-70.516 17.618-101.91L.097 74.237l47.14-47.14 75.919 75.92.001-.002 25.551 25.553 338.766 338.764 126.43 126.431ZM373.667 534H240.334c0 36.819 29.847 66.667 66.666 66.667 36.819 0 66.667-29.848 66.667-66.667ZM307 .667a216.668 216.668 0 0 1 51.667 9.666c106.92 24.42 180.19 138.029 181.645 262.88l.022 3.787v66.667l44.337 126.581-108.78-108.78-2.224-6.468v-79.667c0-97.666-56.333-185.333-131-203.666A147.011 147.011 0 0 0 307 67.333c-33.996 0-65.626 12.244-91.996 33.251L167.72 53.299C206.577 20.232 254.766.667 307 .667Zm86.192 466.665L145.179 219.318c-3.069 14.912-4.741 30.479-4.841 46.489l-.004 1.526V355l-3.667 12.333-35.667 100 292.192-.001Z" />
    </svg>
  );
}

export function BellFilledIcon({ className, style }: { className?: ClassName; style?: CSSProperties }) {
  return (
    <svg className={createClassName(baseStyles.svg, className)} style={style} viewBox="0 0 18 20">
      <path d="M12.257 17a3.5 3.5 0 0 1-6.929 0h6.93ZM0 16l2-5.71V8c0-4.42 3.13-8 7-8a6.5 6.5 0 0 1 1.55.29c3.24.74 5.45 4.21 5.45 8v2L18 16H0Z" />
    </svg>
  );
}

export function BellOutlinedIcon({ className, style }: { className?: ClassName; style?: CSSProperties }) {
  return (
    <svg className={createClassName(baseStyles.svg, className)} style={style} viewBox="0 0 600 668">
      <path d="M366.667 534c0 36.819-29.848 66.667-66.667 66.667S233.333 570.819 233.333 534h133.334ZM300 .667C171 .667 66.667 120 66.667 267.333v76.334L0 534h166.667c0 73.638 59.695 133.333 133.333 133.333S433.333 607.638 433.333 534H600l-66.667-190.333V277c0-126.333-73.666-242-181.666-266.667A216.668 216.668 0 0 0 300 .667ZM94 467.333l35.667-100L133.333 355v-87.667c0-110.333 74.667-200 166.667-200 12.021-.019 24 1.436 35.667 4.334 74.666 18.333 131 106 131 203.666V355l3.666 10.667L506 467.333H94Z" />
    </svg>
  );
}
