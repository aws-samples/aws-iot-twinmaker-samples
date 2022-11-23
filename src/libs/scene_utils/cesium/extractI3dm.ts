// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2022
// SPDX-License-Identifier: Apache-2.0

import { defined, DeveloperError } from 'cesium';
import { bufferToJson } from './bufferToJson';
import { getTileFormat } from './getTileFormat';

/**
 * Extracts information and sections from an i3dm buffer.
 *
 * @param {Buffer} buffer A buffer containing an i3dm asset.
 * @returns {Object} An object containing the header and sections of the i3dm asset.
 */
export function extractI3dm(buffer: Buffer): Object {
  if (!defined(buffer)) {
    throw new DeveloperError('buffer is not defined.');
  }
  const tileFormat = getTileFormat(buffer);
  if (tileFormat !== 'i3dm') {
    throw new DeveloperError('Invalid tile format, expected "i3dm", got: "' + tileFormat + '".');
  }
  const version = buffer.readUInt32LE(4);
  if (version !== 1) {
    throw new DeveloperError('Invalid version, only "1" is valid, got: "' + version + '".');
  }

  const byteLength = buffer.readUInt32LE(8);
  const featureTableJsonByteLength = buffer.readUInt32LE(12);
  const featureTableBinaryByteLength = buffer.readUInt32LE(16);
  const batchTableJsonByteLength = buffer.readUInt32LE(20);
  const batchTableBinaryByteLength = buffer.readUInt32LE(24);
  const gltfFormat = buffer.readUInt32LE(28);

  if (gltfFormat !== 1) {
    throw new DeveloperError('Only embedded binary glTF is supported.');
  }

  const headerByteLength = 32;
  const featureTableJsonByteOffset = headerByteLength;
  const featureTableBinaryByteOffset = featureTableJsonByteOffset + featureTableJsonByteLength;
  const batchTableJsonByteOffset = featureTableBinaryByteOffset + featureTableBinaryByteLength;
  const batchTableBinaryByteOffset = batchTableJsonByteOffset + batchTableJsonByteLength;
  const gltfByteOffset = batchTableBinaryByteOffset + batchTableBinaryByteLength;

  const gltfByteLength = byteLength - gltfByteOffset;
  if (gltfByteLength === 0) {
    throw new DeveloperError('glTF byte length is zero, i3dm must have a glTF to instance.');
  }

  const featureTableJsonBuffer = buffer.slice(featureTableJsonByteOffset, featureTableBinaryByteOffset);
  const featureTableBinaryBuffer = buffer.slice(featureTableBinaryByteOffset, batchTableJsonByteOffset);
  const batchTableJsonBuffer = buffer.slice(batchTableJsonByteOffset, batchTableBinaryByteOffset);
  const batchTableBinaryBuffer = buffer.slice(batchTableBinaryByteOffset, gltfByteOffset);
  let glbBuffer = buffer.slice(gltfByteOffset, byteLength);
  glbBuffer = alignGlb(glbBuffer, gltfByteOffset);

  const featureTableJson = bufferToJson(featureTableJsonBuffer);
  const batchTableJson = bufferToJson(batchTableJsonBuffer);

  return {
    header: {
      magic: tileFormat,
      version: version,
      gltfFormat: gltfFormat,
    },
    featureTable: {
      json: featureTableJson,
      binary: featureTableBinaryBuffer,
    },
    batchTable: {
      json: batchTableJson,
      binary: batchTableBinaryBuffer,
    },
    glb: glbBuffer,
  };
}

function alignGlb(buffer: Buffer, byteOffset: number) {
  if (byteOffset % 4 === 0) {
    return buffer;
  }
  return Buffer.from(buffer);
}