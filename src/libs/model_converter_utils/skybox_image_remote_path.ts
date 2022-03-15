
export function buildRemotePath(modelId: string, viewpointId: string, fileName: string) {
  return `${modelId}/${viewpointId}/${fileName}`;
}