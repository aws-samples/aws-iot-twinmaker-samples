export type ViewPoint = {
  modelId: string;
  id: string;
  name: string;
  position: number[];
  rotation: number[];
  skyboxImages: Image[];
  floorOffset: number[];
}

export type Image = {
  fileName: string;
  path: string;
}