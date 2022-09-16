export type CesiumModelType = '3D_MODEL' | 'POINT_CLOUD';

export type CesiumUploadLocation = {
  endpoint: string;
  bucket: string;
  prefix: string;
  accessKey: string;
  secretAccessKey: string;
  sessionToken: string;
};

export type CesiumOnComplete = {
  method: string;
  url: string;
  fields: any;
};
