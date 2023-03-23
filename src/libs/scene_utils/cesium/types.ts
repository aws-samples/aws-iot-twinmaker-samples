// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2022
// SPDX-License-Identifier: Apache-2.0

export type ModelType = '3D_MODEL' | 'POINT_CLOUD';
export type GeometryCompression = 'NONE' | 'DRACO';
export type AssetType = '3DTILES';

export type UploadAssetRequest = {
  name: string;
  description: string;
  type: AssetType;
  options: {
    sourceType: ModelType;
    geometryCompression: GeometryCompression;
  };
};

export type UploadLocation = {
  endpoint: string;
  bucket: string;
  prefix: string;
  accessKey: string;
  secretAccessKey: string;
  sessionToken: string;
};

export type OnComplete = {
  method: string;
  url: string;
  fields: any;
};

export type ArchiveCreationRequest = {
  format: string;
};
