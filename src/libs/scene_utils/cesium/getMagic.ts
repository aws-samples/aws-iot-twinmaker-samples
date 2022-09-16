import { defaultValue } from 'cesium';

/**
 * @private
 */
export function getMagic(tileBuffer: Buffer, byteOffset?: number) {
  byteOffset = defaultValue(byteOffset, 0);
  return tileBuffer.toString('utf8', byteOffset, byteOffset! + 4);
}
