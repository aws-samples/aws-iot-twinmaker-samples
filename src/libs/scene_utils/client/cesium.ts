// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2022
// SPDX-License-Identifier: Apache-2.0

import { createReadStream, createWriteStream } from 'fs';
import { ArchiveCreationRequest, ModelType, OnComplete, UploadAssetRequest, UploadLocation } from '../cesium/types';
import { Credentials, S3 } from 'aws-sdk';
import { logProgress } from '../utils/file_utils';
import { basename, join } from 'path';
import fetch, { RequestInit, Response } from 'node-fetch';
import { CESIUM_PROD_ACCOUNT_ID } from '../cesium/constants';

export class CesiumClient {
  private checkStatus(res: Response, errorMessage: (res: Response) => string) {
      if (res.ok) { // res.status >= 200 && res.status < 300
          return res;
      } else {
          throw new Error(errorMessage(res));
      }
  }

  private async handleRequest(url: string, options: RequestInit, errorMessage: (res: Response) => string): Promise<Response> {
    const response = await fetch(url, options);
    return this.checkStatus(response, errorMessage);
  }

  private handleResponse(responseStream: NodeJS.ReadableStream): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      let data: Buffer[] = [];
      responseStream.on('data', (chunk) => {
        data.push(Buffer.from(chunk))
      }).on('end', () => {
        const buffer = Buffer.concat(data);
        resolve(buffer); 
      }).on('error', (error) => {
        console.error(error);
        reject(error);
      });
    });
  }

  private async handleCesiumAPI(url: string, options: RequestInit, errorMessage: (res: Response) => string): Promise<any> {
    const response = await this.handleRequest(url, { ...options, compress: false }, errorMessage);
    return this.handleResponse(response.body);
  }

  // Tell Cesium we want to upload a file
  private async uploadAssetRequest(accessToken: string, request: UploadAssetRequest) {
    const url = 'https://api.cesium.com/v1/assets';
    const body = JSON.stringify(request);
    const options: RequestInit = {
      method: 'POST',
      body,
      headers: { 
        'Content-Type': 'application/json',
        'Content-Length': body.length.toString(),
        Authorization: `Bearer ${accessToken}`,  
      },
    };
    const errorMessage = (res: Response) => {
      return `[Error ${res.status}] Failed to process asset upload request with error: ${res.statusText}`;
    }

    return this.handleCesiumAPI(url, options, errorMessage);
  }

  // Upload file to S3 location provided by Cesium
  private async uploadAssetToS3Location(assetPath: string, uploadLocation: UploadLocation) {
    const cesiumS3 = new S3({
      region: 'us-east-1',
      signatureVersion: 'v4',
      endpoint: uploadLocation.endpoint,
      credentials: new Credentials(
        uploadLocation.accessKey,
        uploadLocation.secretAccessKey,
        uploadLocation.sessionToken,
      ),
    });

    const fileName = basename(assetPath);
    return cesiumS3
      .upload({
        Body: createReadStream(assetPath),
        Bucket: uploadLocation.bucket,
        Key: `${uploadLocation.prefix}${fileName}`,
        ExpectedBucketOwner: CESIUM_PROD_ACCOUNT_ID,
      })
      .promise();
  }

  // Tell Cesium the file has been uploaded to S3 and start tiling
  private async startTilingForAsset(accessToken: string, onComplete: OnComplete) {
    const url = onComplete.url;
    const options: RequestInit = {
      method: onComplete.method,
      body: JSON.stringify(onComplete.fields),
      headers: { Authorization: `Bearer ${accessToken}` },
    };
    const errorMessage = (res: Response) => {
      return `[Error ${res.status}] Failed to request tiling on Cesium asset with error: ${res.statusText}`;
    }

    return this.handleCesiumAPI(url, options, errorMessage);
  }

  // Log progress of tiling for a Cesium asset
  private async waitForTiles(
    accessToken: string,
    assetId: string,
    timeoutInMs: number = 10000, // Default refresh every 10 seconds
    maxChecks: number = 30, // Default wait for 5 minutes
  ) {
    let done = false;

    while (!done && maxChecks-- > 0) {
      // Issue a GET request for the metadata
      const response = await this.getAsset(accessToken, assetId);
      const assetMetadata = JSON.parse(response.toString());
      const status = assetMetadata.status;
      if (status === 'COMPLETE') {
        process.stdout.clearLine(0);
        console.log('\nAsset tiled successfully', `View in Cesium Ion: https://cesium.com/ion/assets/${assetId}`);
        done = true;
      } else if (status === 'DATA_ERROR') {
        console.error('Cesium Ion detected a problem with the uploaded data.');
        break;
      } else if (status === 'ERROR') {
        console.error('An unknown tiling error occurred, please contact support@cesium.com.');
        break;
      } else if (status === 'NOT_STARTED') {
        logProgress('Tiling pipeline initializing.');
      } else if (status === 'IN_PROGRESS') {
        logProgress(`Asset is ${assetMetadata.percentComplete}% complete.`);
      } else {
        console.error(`Unrecognized response when requesting the tiling status of asset ${assetId}: ${status}`);
      }
      await new Promise((resolve) => setTimeout(resolve, timeoutInMs));
    }

    if (!done) {
      console.log(`\nCheck the asset tiling status in Cesium Ion: https://cesium.com/ion/assets/${assetId}`);
      console.log(`Rerun this script with the parameter --cesiumAssetId ${assetId} when the tiling is complete.`);
    }

    return done;
  }

  // Call assets API to get the asset metadata
  public async getAsset(accessToken: string, assetId: string): Promise<any> {
    const url = `https://api.cesium.com/v1/assets/${assetId}`;
    const options: RequestInit = {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    };
    const errorMessage = (res: Response) => {
      return `[Error ${res.status}] Failed to get asset ID ${assetId} with error: ${res.statusText}`;
    }

    return this.handleCesiumAPI(url, options, errorMessage);
  }

  // Upload a local file to Cesium and wait for tiling
  public async upload(accessToken: string, assetPath: string, description: string, dracoCompression?: boolean) {
    const fileName = basename(assetPath);
    const fileNameSplit = fileName.split('.');
    let assetName: string | undefined;
    if (fileNameSplit.length > 0) {
      assetName = fileNameSplit[0];
    }
    const cesiumModelType = this.getCesiumModelType(assetPath);

    let cesiumAssetId: string | undefined;
    let tilingDone = false;

    if (!!assetName && !!cesiumModelType) {
      /* Step 1:
       * Tell Cesium we want to upload an asset.
       * Cesium gives us the credentials and S3 location to upload to, and a
       * callback function to trigger tiling on the asset.
       */
      const request: UploadAssetRequest = {
        name: assetName,
        description,
        type: '3DTILES', // Output a tileset
        options: {
          sourceType: cesiumModelType,
          geometryCompression: dracoCompression ? 'DRACO' : 'NONE',
        },
      };
      const responseBuffer = await this.uploadAssetRequest(accessToken, request);
      const response = JSON.parse(responseBuffer.toString());

      cesiumAssetId = response.assetMetadata.id;
      if (!!cesiumAssetId) {
        // Step 2: Upload local file to S3 location
        await this.uploadAssetToS3Location(assetPath, response.uploadLocation);
        // Step 3: Call onComplete callback to trigger tiling on the asset
        await this.startTilingForAsset(accessToken, response.onComplete);
        // Step 4: Wait up to 5 minutes for tiling
        tilingDone = await this.waitForTiles(accessToken, cesiumAssetId);
      }
    } else {
      console.error(`This script supports GLTF, GLB, OBJ, FBX, DAE, LAS, and LAZ file formats to upload to Cesium.`);
      process.exit(1);
    }

    return [cesiumAssetId, tilingDone] as const;
  }

  // List existing archives for a Cesium asset
  public listArchivesRequest(accessToken: string, assetId: string) {
    const url = `https://api.cesium.com/v1/assets/${assetId}/archives`;
    const options: RequestInit = {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    };
    const errorMessage = (res: Response) => {
      return `[Error ${res.status}] Failed to list archives with error: ${res.statusText}`;
    }

    return this.handleCesiumAPI(url, options, errorMessage);
  }

  // Request a Cesium asset to be archived for download
  private createArchiveRequest(accessToken: string, assetId: string, request: ArchiveCreationRequest) {
    const url = `https://api.cesium.com/v1/assets/${assetId}/archives`;
    const body = JSON.stringify(request);
    const options: RequestInit = {
      method: 'POST',
      body,
      headers: { 
        'Content-Type': 'application/json',
        'Content-Length': body.length.toString(),
        Authorization: `Bearer ${accessToken}`,  
      },
    };
    const errorMessage = (res: Response) => {
      return `[Error ${res.status}] Failed to process asset archive request with error: ${res.statusText}`;
    }

    return this.handleCesiumAPI(url, options, errorMessage);
  }

  // Call archive API to get the archive status
  private getArchiveStatus(accessToken: string, assetId: string, archiveId: string): Promise<any> {
    const url = `https://api.cesium.com/v1/assets/${assetId}/archives/${archiveId}`;
    const options: RequestInit = {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    };
    const errorMessage = (res: Response) => {
      return `[Error ${res.status}] Failed to get archive status for archive ID ${archiveId} with error: ${res.statusText}`;
    }

    return this.handleCesiumAPI(url, options, errorMessage);
  }

  // Log progress of archive creation
  private async waitForArchive(
    accessToken: string,
    assetId: string,
    archiveId: string,
    timeoutInMs: number = 10000, // Default refresh every 10 seconds
    maxChecks: number = 30, // Default wait for 5 minutes
  ) {
    let done = false;

    while (!done && maxChecks-- > 0) {
      // Issue a GET request for the metadata
      const response = await this.getArchiveStatus(accessToken, assetId, archiveId);
      const archiveMetadata = JSON.parse(response.toString());
      const status = archiveMetadata.status;
      const bytesArchived = archiveMetadata.bytesArchived;

      if (status === 'COMPLETE') {
        process.stdout.clearLine(0);
        console.log(`\nArchive with id ${archiveId} completed successfully!`);
        console.log(`Archived ${bytesArchived} bytes. Ready to download.`);
        done = true;
      } else if (status === 'ERROR') {
        console.error('An unknown archive error occurred, please contact support@cesium.com.');
        break;
      } else if (status === 'QUEUED') {
        logProgress('Archive request has been queued.');
      } else if (status === 'NOT_STARTED') {
        logProgress('Server has not started the archive process, make sure the asset tiling is complete.');
      } else if (status === 'IN_PROGRESS') {
        logProgress(`Asset archive is in progress.`);
      } else {
        console.error(`Unrecognized response when requesting the archive status of asset ${assetId}: ${status}`);
      }
      await new Promise((resolve) => setTimeout(resolve, timeoutInMs));
    }

    if (!done) {
      console.log(`Archive for asset ${assetId} is still in progress.`);
      console.log(`Rerun this script with the parameter --cesiumArchiveId ${archiveId} to continue downloading the archived tileset.`);
    }

    return done;
  }

  // Request for a Cesium archive to be downloaded
  private archiveDownloadRequest(accessToken: string, assetId: string, archiveId: string): Promise<Response> {
    const url = `https://api.cesium.com/v1/assets/${assetId}/archives/${archiveId}/download`;
    const options: RequestInit = {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    };
    const errorMessage = (res: Response) => {
      return `[Error ${res.status}] Failed to request archive download for archive ID ${archiveId} with error: ${res.statusText}`;
    }

    return this.handleRequest(url, options, errorMessage);
  }

  // Cesium provides archives through an S3 presigned URL
  private archiveDownloadS3Presigned(presignedUrl: string, archiveId: string): Promise<Response> {
    const options: RequestInit = { method: 'GET' };
    const errorMessage = (res: Response) => {
      return `[Error ${res.status}] Failed to download archive for archive ID ${archiveId} with error: ${res.statusText}`;
    }

    return this.handleRequest(presignedUrl, options, errorMessage);
  }

  public async downloadArchive(accessToken: string, assetId: string, archiveId: string): Promise<string> {
    // Get archive
    console.log(`Downloading archive ${archiveId} of asset ID ${assetId}`);
    const archiveDownload = await this.archiveDownloadRequest(accessToken, assetId, archiveId);
    // Cesium provides archives through an S3 presigned URL
    const s3PresignedUrl = archiveDownload.url;
    const archiveResult = await this.archiveDownloadS3Presigned(s3PresignedUrl, archiveId);

    // Get asset name
    const assetMetadata = await this.getAsset(accessToken, assetId);
    const assetJson = JSON.parse(assetMetadata.toString());
    const assetName = assetJson.name;

    // Prepare local archive path
    const archiveName = `${assetId}-${assetName}-tileset`;
    const archivePath = join(process.cwd(), `${archiveName}.zip`);
    const dest = createWriteStream(archivePath);

    // Stream result to local file
    const stream = archiveResult.body?.pipe(dest);
    await new Promise((resolve, reject) => {
      stream.on('finish', () => {
        console.log(`Finished downloading archive to local path ${archivePath}`);
        resolve(() => {});
      }).on('error', err => reject(err));
    });

    return archivePath;
  }

  public async createArchive(accessToken: string, assetId: string) {
    // Submit archive creation job
    const creationRequest: ArchiveCreationRequest = {
      format: 'ZIP',
    };
    const response = await this.createArchiveRequest(accessToken, assetId, creationRequest);
    console.log(`Submitted request to creation archive of asset ID ${assetId}`);

    const archiveMetadata = JSON.parse(response.toString());
    const archiveId = archiveMetadata.id;

    let archiveCreated = false;
    if (!!archiveId) {
      // Wait for archive to complete
      archiveCreated = await this.waitForArchive(accessToken, assetId, archiveId);
    }
    
    return [archiveId, archiveCreated] as const;
  }

  private getCesiumModelType(assetPath: string | undefined): ModelType | undefined {
    let modelType: ModelType | undefined;
    if (!!assetPath) {
      const fileName = basename(assetPath);
      const fileNameSplit = fileName.split('.');
      if (fileNameSplit.length > 1) {
        switch (fileNameSplit[1].toUpperCase()) {
          case 'GLTF':
          case 'GLB':
          case 'OBJ':
          case 'FBX':
          case 'DAE':
            modelType = '3D_MODEL';
            break;
          case 'LAS':
          case 'LAZ':
            modelType = 'POINT_CLOUD';
            break;
          default:
            return modelType;
        }
      }
    }
    return modelType;
  }
}
