// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { createClassName, type ComponentProps } from '@iot-prototype-kit/core/utils/element';

import styles from './styles.module.scss';

export function AlarmMarkerNueue0({ children, className, ...props }: ComponentProps) {
  return (
    <svg className={createClassName(styles.svg2, styles.priority1, className)} viewBox="0 0 50 50" {...props}>
      <circle cx="25" cy="25" r="24" data-circle-outer />
      <circle cx="25" cy="25" r="20" data-circle-inner />
    </svg>
  );
}

export function AlarmMarkerNueue1({ children, className, ...props }: ComponentProps) {
  return (
    <svg className={createClassName(styles.svg2, styles.priority1, className)} viewBox="0 0 50 50" {...props}>
      {/* <circle cx="25" cy="25" r="25" fill="red" /> */}
      <circle cx="25" cy="25" r="24" data-circle-outer />
      <circle cx="25" cy="25" r="20" data-circle-inner />
      <rect width="18" height="18" x="16" y="16" rx="2" data-priority />
    </svg>
  );
}

export function AlarmMarkerNueue2({ children, className, ...props }: ComponentProps) {
  return (
    <svg className={createClassName(styles.svg2, styles.priority2, className)} viewBox="0 0 50 50" {...props}>
      <circle cx="25" cy="25" r="24" data-circle-outer />
      <circle cx="25" cy="25" r="20" data-circle-inner />
      <path
        d="M23.241 14.247c.757-1.397 2.761-1.397 3.518 0l9.642 17.8C37.122 33.38 36.158 35 34.642 35H15.358c-1.516 0-2.48-1.62-1.759-2.953l9.642-17.8Z"
        data-priority
      />
    </svg>
  );
}

export function AlarmMarkerNueue3({ children, className, ...props }: ComponentProps) {
  return (
    <svg className={createClassName(styles.svg2, styles.priority3, className)} viewBox="0 0 50 50" {...props}>
      <circle cx="25" cy="25" r="24" data-circle-outer />
      <circle cx="25" cy="25" r="20" data-circle-inner />
      <path
        d="M26.759 35.753c-.757 1.397-2.761 1.397-3.518 0l-9.642-17.8C12.877 16.62 13.842 15 15.358 15h19.284c1.516 0 2.48 1.62 1.759 2.953l-9.642 17.8Z"
        data-priority
      />
    </svg>
  );
}

export function AlarmMarkerNueue4({ children, className, ...props }: ComponentProps) {
  return (
    <svg className={createClassName(styles.svg2, styles.priority4, className)} viewBox="0 0 50 50" {...props}>
      <circle cx="25" cy="25" r="24" data-circle-outer />
      <circle cx="25" cy="25" r="20" data-circle-inner />
      <rect width="18" height="18" x="12.272" y="25" rx="2" transform="rotate(-45 12.272 25)" data-priority />
    </svg>
  );
}
