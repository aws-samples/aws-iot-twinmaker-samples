// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2022
// SPDX-License-Identifier: Apache-2.0

import { defaultValue } from 'cesium';

export function getTileFormat(tileBuffer: Buffer, byteOffset?: number) {
  byteOffset = defaultValue(byteOffset, 0);
  return tileBuffer.toString('utf8', byteOffset, byteOffset! + 4);
}
