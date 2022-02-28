export type ViewPoint = {
  modelId: string;
  id: string;
  name: string;
  position: number[];
  cameraRotation: number[];
  skyboxImages: Image[];
  cameraPosition: number[];
}

export type Image = {
  fileName: string;
  path: string;
}