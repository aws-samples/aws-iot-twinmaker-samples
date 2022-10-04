// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2022
// SPDX-License-Identifier: Apache-2.0

import { defined, DeveloperError } from 'cesium';
import { getTileFormat } from './getTileFormat';

/**
 * Extracts interior tiles from a cmpt buffer. This operates recursively on interior cmpt tiles.
 *
 * @param {Buffer} buffer A buffer containing a cmpt asset.
 * @returns {Buffer[]} An array containing interior tiles.
 */
export function extractCmpt(buffer: Buffer): Buffer[] {
  const results: Buffer[] = [];
  extractCmptInner(buffer, results);
  return results;
}

function extractCmptInner(buffer: Buffer, results: Buffer[]) {
  if (!defined(buffer)) {
    throw new DeveloperError('buffer is not defined.');
  }

  const tileFormat = getTileFormat(buffer);
  if (tileFormat !== 'cmpt') {
    throw new DeveloperError('Invalid tile format, expected "cmpt", got: "' + tileFormat + '".');
  }

  const version = buffer.readUInt32LE(4);
  if (version !== 1) {
    throw new DeveloperError('Invalid version, only "1" is valid, got: "' + version + '".');
  }

  const tilesLength = buffer.readUInt32LE(12);
  let byteOffset = 16;

  for (let i = 0; i < tilesLength; ++i) {
    const innerTileFormat = getTileFormat(buffer, byteOffset);
    const innerByteLength = buffer.readUInt32LE(byteOffset + 8);
    const innerBuffer = buffer.slice(byteOffset, byteOffset + innerByteLength);
    byteOffset += innerByteLength;

    if (innerTileFormat === 'cmpt') {
      extractCmptInner(innerBuffer, results);
    } else {
      results.push(innerBuffer);
    }
  }
}
