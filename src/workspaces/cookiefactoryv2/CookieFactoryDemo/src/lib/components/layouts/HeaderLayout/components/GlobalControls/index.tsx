// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import { useGlobalControlState } from '@/lib/state/control';
import { createClassName, type ClassName } from '@/lib/utils/element';

import styles from './styles.module.css';

export function GlobalControls({ className }: { className?: ClassName }) {
  const [globalControl] = useGlobalControlState();
  
  return <section className={createClassName(styles.root, className)}>{globalControl}</section>;
}
