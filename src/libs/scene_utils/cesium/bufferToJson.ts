/**
 * @private
 */
export function bufferToJson(buffer: Buffer) {
  if (buffer.length === 0) {
    return {};
  }
  return JSON.parse(buffer.toString());
}
