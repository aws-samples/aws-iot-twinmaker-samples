export type ViewPoint = {
  modelId: string;
  id: string;
  name: string;
  position: Position;
  rotation: Quaternion;
  skyboxImages: Image[];
  floorOffset: Position;
}

export type Image = {
  fileName: string;
  path: string;
}
export type Quaternion = {
  x: number;
  y: number;
  z: number;
  w: number;
}

export type Position = {
  x: number;
  y: number;
  z: number;
}