import { defined, DeveloperError } from 'cesium';
import { getMagic } from './getMagic';

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

  const magic = getMagic(buffer);
  if (magic !== 'cmpt') {
    throw new DeveloperError('Invalid magic, expected "cmpt", got: "' + magic + '".');
  }

  const version = buffer.readUInt32LE(4);
  if (version !== 1) {
    throw new DeveloperError('Invalid version, only "1" is valid, got: "' + version + '".');
  }

  const tilesLength = buffer.readUInt32LE(12);
  let byteOffset = 16;

  for (var i = 0; i < tilesLength; ++i) {
    const innerMagic = getMagic(buffer, byteOffset);
    const innerByteLength = buffer.readUInt32LE(byteOffset + 8);
    const innerBuffer = buffer.slice(byteOffset, byteOffset + innerByteLength);
    byteOffset += innerByteLength;

    if (innerMagic === 'cmpt') {
      extractCmptInner(innerBuffer, results);
    } else {
      results.push(innerBuffer);
    }
  }
}
