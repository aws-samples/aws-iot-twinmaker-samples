// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2022
// SPDX-License-Identifier: Apache-2.0

import { createReadStream } from 'fs';
import { request } from 'https';
import { IncomingMessage } from 'http';
import { ExportAssetRequest, ModelType, OnComplete, UploadAssetRequest, UploadLocation } from '../cesium/types';
import { Credentials, S3 } from 'aws-sdk';
import { logProgress } from '../utils/file_utils';
import * as status from 'http-status';
import { basename } from 'path';

export class CesiumClient {
  // Process a request and resolve the response data
  private standardRequestHandler(options, errorMessage: (result: IncomingMessage) => string, body?): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      let data: Buffer[] = [];
      const req = request(options, (res) => {
        // Reject statusCode that is not 2xx
        if (status[`${res.statusCode}_CLASS`] !== status.classes.SUCCESSFUL) {
          reject(errorMessage(res));
          return;
        }

        res.on('data', (chunk: Buffer) => {
          data.push(chunk);
        });

        res.on('end', () => {
          const buffer = Buffer.concat(data);
          resolve(buffer);
        });
      });

      req.on('error', (error) => {
        console.error(error);
        reject(error);
      });

      // Handle POST requests
      if (options.method === 'POST' && !!body) {
        req.write(body);
      }

      req.end();
    });
  }

  // Tell Cesium we want to upload a file
  private async uploadAssetRequest(accessToken: string, request: UploadAssetRequest) {
    const url = 'https://api.cesium.com/v1/assets';
    const urlObject = new URL(url);

    const bodyJSON = JSON.stringify(request);

    // Issue a POST request to upload local file
    const options = {
      hostname: urlObject.hostname,
      port: 443,
      path: urlObject.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': bodyJSON.length,
        Authorization: `Bearer ${accessToken}`,
      },
    };

    return this.standardRequestHandler(
      options,
      (res: IncomingMessage) =>
        `[Error ${res.statusCode}] Failed to process asset upload request with error: ${res.statusMessage}`,
      bodyJSON,
    );
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
      })
      .promise();
  }

  // Tell Cesium the file has been uploaded to S3 and start tiling
  private async startTilingForAsset(accessToken: string, onComplete: OnComplete) {
    const urlObject = new URL(onComplete.url);
    const port = urlObject.protocol.toLowerCase() === 'https:' ? 443 : 80;
    const body = JSON.stringify(onComplete.fields);

    const options = {
      hostname: urlObject.hostname,
      port,
      path: urlObject.pathname,
      method: onComplete.method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': body.length,
        Authorization: `Bearer ${accessToken}`,
      },
    };

    return this.standardRequestHandler(
      options,
      (res: IncomingMessage) =>
        `[Error ${res.statusCode}] Failed to request tiling on Cesium asset with error: ${res.statusMessage}`,
      body,
    );
  }

  // Log progress of tiling for a Cesium asset
  private async waitForTiles(
    accessToken: string,
    assetId: string,
    timeoutInMs: number = 10000, // Default 10 seconds
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
        console.log('\nAsset tiled successfully');
        console.log(`View in Cesium Ion: https://cesium.com/ion/assets/${assetId}`);
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
    const urlObject = new URL(url);

    const options = {
      hostname: urlObject.hostname,
      port: 443,
      path: urlObject.pathname,
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
      json: true,
    };

    return this.standardRequestHandler(
      options,
      (res: IncomingMessage) =>
        `[Error ${res.statusCode}] Failed to get asset ID ${assetId} with error: ${res.statusMessage}`,
    );
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

  // Request a Cesium asset to be exported to an S3 bucket
  private async exportAssetRequest(accessToken: string, assetId: string, request: ExportAssetRequest) {
    const url = `https://api.cesium.com/v1/assets/${assetId}/exports`;
    const urlObject = new URL(url);

    const bodyJSON = JSON.stringify(request);

    // Issue a POST request to export an asset
    const options = {
      hostname: urlObject.hostname,
      port: 443,
      path: urlObject.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': bodyJSON.length,
        Authorization: `Bearer ${accessToken}`,
      },
    };

    return this.standardRequestHandler(
      options,
      (res: IncomingMessage) =>
        `[Error ${res.statusCode}] Failed to process asset export request with error: ${res.statusMessage}`,
      bodyJSON,
    );
  }

  // Call exports API to get the export status
  private async getExportStatus(accessToken: string, assetId: string, exportId: string): Promise<any> {
    const url = `https://api.cesium.com/v1/assets/${assetId}/exports/${exportId}`;
    const urlObject = new URL(url);

    const options = {
      hostname: urlObject.hostname,
      port: 443,
      path: urlObject.pathname,
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
      json: true,
    };

    return this.standardRequestHandler(
      options,
      (res: IncomingMessage) =>
        `[Error ${res.statusCode}] Failed to get export status for ${exportId} with error: ${res.statusMessage}`,
    );
  }

  // Log progress of Cesium asset export to S3
  private async waitForExport(
    accessToken: string,
    assetId: string,
    exportId: string,
    timeoutInMs: number = 10000, // Default 10 seconds
    maxChecks: number = 30, // Default wait for 5 minutes
  ) {
    let done = false;

    while (!done && maxChecks-- > 0) {
      // Issue a GET request for the metadata
      const response = await this.getExportStatus(accessToken, assetId, exportId);
      const exportMetadata = JSON.parse(response.toString());
      const status = exportMetadata.status;
      const bytesExported = exportMetadata.bytesExported;
      const s3BucketPath = `${exportMetadata.to.bucket}/${exportMetadata.to.prefix}`;

      if (status === 'COMPLETE') {
        process.stdout.clearLine(0);
        console.log('\nExport completed successfully!');
        console.log(`Exported ${bytesExported} bytes to the S3 path ${s3BucketPath}`);
        done = true;
      } else if (status === 'QUEUED') {
        logProgress('The asset export request is in the server queue.');
      } else if (status === 'ERROR') {
        console.error('An unknown export error occurred, please contact support@cesium.com.');
        break;
      } else if (status === 'NOT_STARTED') {
        logProgress('Server has not started the export process, make sure the asset tiling is complete.');
      } else if (status === 'IN_PROGRESS') {
        logProgress(`Asset export is in progress.`);
      } else {
        console.error(`Unrecognized response when requesting the export status of asset ${assetId}: ${status}`);
      }
      await new Promise((resolve) => setTimeout(resolve, timeoutInMs));
    }

    if (!done) {
      console.log(`Export for asset ${assetId} is still in progress.`);
      console.log(`Check your workspace's S3 bucket for the tileset to confirm the completion of the export.`);
    }

    return done;
  }

  public async exportTileset(bucketName: string, accessToken: string, assetId: string) {
    console.log(`Uploading tileset to S3 bucket ${bucketName} for Cesium asset ID ${assetId}...`);

    const assetMetadata = await this.getAsset(accessToken, assetId);
    const assetJson = JSON.parse(assetMetadata.toString());
    const assetName = assetJson.name;
    const outputPath = `${assetName}-${assetId}`;

    if (
      process.env.AWS_ACCESS_KEY_ID !== undefined &&
      process.env.AWS_SECRET_ACCESS_KEY !== undefined &&
      process.env.AWS_SESSION_TOKEN !== undefined
    ) {
      const request: ExportAssetRequest = {
        type: 'S3',
        bucket: bucketName,
        prefix: outputPath,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sessionToken: process.env.AWS_SESSION_TOKEN,
      };

      // Submit export job
      const response = await this.exportAssetRequest(accessToken, assetId, request);
      console.log(`Submitted request to export asset ${assetId} to the S3 path ${bucketName}/${outputPath}`);
      const exportMetadata = JSON.parse(response.toString());
      const exportId = exportMetadata.id;
      // Wait for export to complete
      await this.waitForExport(accessToken, assetId, exportId);
    } else {
      console.error(`
      Cannot find temporary AWS credentials for exporting asset ${assetId}. 
      Set the following environment variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN
      `);
    }
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
