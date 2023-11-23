// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { createClassName, type ComponentProps } from '@iot-prototype-kit/core/utils/element';

import baseStyles from '../styles.module.css';

/**
 * Vectors and icons by <a href="https://www.wishforge.games/?ref=svgrepo.com" target="_blank">Wishforge.games</a> in CC
 * Attribution License via <a href="https://www.svgrepo.com/" target="_blank">SVG Repo</a>
 */
export function NetworkIcon({ children, className, ...props }: ComponentProps) {
  return (
    <svg className={createClassName(baseStyles.svg, className)} viewBox="0 0 300 302" {...props}>
      <path d="M263.44 193.548c-8.601 0-16.128 3.226-22.58 7.527l-23.656-16.129c5.377-9.677 8.602-21.505 8.602-33.333s-3.225-22.58-7.526-32.258l11.828-7.527c6.451 4.301 13.978 7.527 22.58 7.527 20.43 0 37.635-17.204 37.635-37.635 0-20.43-17.205-38.71-37.635-38.71s-37.634 17.205-37.634 37.635c0 4.301 1.075 8.602 2.15 12.903l-10.752 7.527c-13.979-16.129-33.334-25.806-55.914-25.806-17.205 0-32.258 5.376-45.162 15.054L70.968 55.914c2.15-5.376 4.3-11.828 4.3-18.28C75.269 17.204 58.066 0 37.635 0 17.204 0 0 17.204 0 37.634S17.204 75.27 37.634 75.27c6.452 0 12.904-2.15 18.28-4.301l34.409 34.408c-9.678 12.904-15.054 27.957-15.054 45.162 0 19.354 7.527 37.634 20.43 51.613l-21.505 26.881c-4.302-2.15-9.678-3.226-15.054-3.226-20.43 0-37.635 17.205-37.635 37.635s17.205 37.634 37.635 37.634 37.634-17.204 37.634-37.634c0-7.527-2.15-15.054-6.451-20.43l21.505-26.882c10.753 6.452 23.656 10.753 37.634 10.753 21.506 0 40.86-9.678 54.84-23.656l22.58 16.129c-1.076 4.3-2.15 8.602-2.15 12.903 0 20.43 17.203 37.634 37.634 37.634 20.43 0 37.634-17.204 37.634-37.634s-16.129-38.71-36.56-38.71Z" />
    </svg>
  );
}
