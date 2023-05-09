// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import { createClassName, type ClassName } from '@/lib/core/utils/element';

import baseStyles from '../styles.module.css';

export function ArrowRightIcon({ className }: { className?: ClassName }) {
  return (
    <svg className={createClassName(baseStyles.svg, className)} viewBox="0 0 12 10">
      <path d="M.167 5.833h8.476L5.899 8.577l1.178 1.179L11.833 5 7.077.244 5.899 1.423l2.744 2.743H.167v1.667Z" />
    </svg>
  );
}

{
  /* <svg xmlns="http://www.w3.org/2000/svg" width="12" height="10" fill="none">
  <path
    fill="#B0B1B6"
    fill-rule="evenodd"
    d="M.167 5.833h8.476L5.899 8.577l1.178 1.179L11.833 5 7.077.244 5.899 1.423l2.744 2.743H.167v1.667Z"
    clip-rule="evenodd"
  />
</svg>; */
}
