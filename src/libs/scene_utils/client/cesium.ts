// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2022
// SPDX-License-Identifier: Apache-2.0

import { extname } from 'path';
import { createReadStream, createWriteStream, PathLike, PathOrFileDescriptor, writeFile } from 'fs';
import { request } from 'https';
import { createGunzip } from 'zlib';
import JsonStreamStringify from 'json-stream-stringify';
import { getTileFormat } from '../cesium/getTileFormat';
import { extractB3dm } from '../cesium/extractB3dm';
import { extractI3dm } from '../cesium/extractI3dm';
import { extractCmpt } from '../cesium/extractCmpt';
import { Stream } from 'stream';
import { S3Client } from './s3';
import { IncomingMessage } from 'http';
import { GeometryCompression, ModelType, OnComplete, UploadAssetRequest, UploadLocation } from '../cesium/types';
import { Credentials, S3 } from 'aws-sdk';
import { getFileNameFromPath, logProgress } from '../utils/file_utils';
import * as status from 'http-status';

export class CesiumClient {
  private s3BucketName: string | undefined;
  private s3Client: S3Client;

  constructor(s3BucketName?: string) {
    this.s3BucketName = s3BucketName;
    this.s3Client = new S3Client();
  }

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

    const fileName = getFileNameFromPath(assetPath);
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
  private async waitForTiles(accessToken: string, assetId: string) {
    const timeout = 10000; // 10 seconds
    let maxChecks = 30; // Will wait for 5 minutes
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
      } else {
        if (status === 'NOT_STARTED') {
          logProgress('Tiling pipeline initializing.');
        } else {
          // IN_PROGRESS
          logProgress(`Asset is ${assetMetadata.percentComplete}% complete.`);
        }
      }
      await new Promise((resolve) => setTimeout(resolve, timeout));
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
  public async upload(accessToken: string, assetPath: string, description: string, compression?: GeometryCompression) {
    const fileName = getFileNameFromPath(assetPath);
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
          geometryCompression: compression ?? 'NONE',
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

  // Download tile asset into a data buffer in memory
  public async download(accessToken: string, url: string, isGzip: boolean): Promise<Buffer> {
    const urlObject = new URL(url);
    const port = urlObject.protocol.toLowerCase() === 'https:' ? 443 : 80;

    return new Promise<Buffer>((resolve, reject) => {
      const options = {
        hostname: urlObject.hostname,
        port,
        path: urlObject.pathname,
        method: 'GET',
        gzip: true,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Authorization: `Bearer ${accessToken}`,
        },
      };

      let data: Buffer[] = [];
      const req = request(options, (res) => {
        if (res.statusCode !== 200) {
          reject(`[Error ${res.statusCode}] Failed to download ${url} with error: ${res.statusMessage}`);
          return;
        }

        let stream: Stream;
        if (!isGzip) {
          stream = res;
        } else {
          const gunzip = createGunzip();
          res.pipe(gunzip);
          stream = gunzip;
        }

        stream.on('data', (chunk: Buffer) => {
          data.push(chunk);
        });

        stream.on('end', () => {
          const buffer = Buffer.concat(data);
          resolve(buffer);
        });
      });

      req.on('error', (error) => {
        console.error(error);
        reject(error);
      });

      req.end();
    });
  }

  public getAssetUris(json: any) {
    // Collect asset related content
    const assetUris: string[] = [];
    const queue = [json.root];
    while (queue.length > 0) {
      const node = queue.pop();
      if (node.content && node.content.uri) {
        assetUris.push(node.content.uri);
      }

      if (node.children) {
        node.children.forEach((child) => {
          queue.push(child);
        });
      }
    }
    return assetUris;
  }

  public writeJsonToFile(json: any, outputFile: PathLike) {
    // Upload directly to S3 if an S3 bucket name was provided
    if (!!this.s3BucketName) {
      return this.s3Client.uploadData(this.s3BucketName, outputFile.toString(), JSON.stringify(json));
    } else {
      // Write to local file otherwise
      return new Promise<void>((resolve) => {
        const outputStream = createWriteStream(outputFile);
        const jsonStream = new JsonStreamStringify(json);
        jsonStream.once('error', (err) => console.error('Error', err));
        jsonStream.once('end', () => {
          resolve();
        });
        jsonStream.pipe(outputStream);
      });
    }
  }

  public writeBinaryToFile(data: string | NodeJS.ArrayBufferView, outputFile: PathOrFileDescriptor) {
    // Upload directly to S3 if an S3 bucket name was provided
    if (!!this.s3BucketName) {
      return this.s3Client.uploadData(this.s3BucketName, outputFile.toString(), data);
    } else {
      // Write to local file otherwise
      return new Promise<void>((resolve, reject) => {
        writeFile(outputFile, data, 'binary', function (err) {
          if (err) {
            console.log(err);
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }
  }

  private async writeAssetToFeatureTableBatchTableAndGlb(outputPath: string, assetUri: string, data: any) {
    // Write Feature Table
    await this.writeJsonToFile(data.featureTable.json, `${outputPath}/${assetUri}_featureTable.json`);
    // Write Batch Table
    await this.writeJsonToFile(data.batchTable.json, `${outputPath}/${assetUri}_batchTable.json`);
    // Write GLB
    await this.writeBinaryToFile(data.glb, `${outputPath}/${assetUri}.glb`);
  }

  public async writeAssetToJsonAndGlb(outputPath: string, assetUri: string, data: any) {
    const fileExt = extname(assetUri).toLowerCase();
    switch (fileExt) {
      case '.b3dm': {
        const b3dmData = extractB3dm(data);
        await this.writeAssetToFeatureTableBatchTableAndGlb(outputPath, assetUri, b3dmData);
        break;
      }

      case '.i3dm': {
        const i3dmData = extractI3dm(data);
        await this.writeAssetToFeatureTableBatchTableAndGlb(outputPath, assetUri, i3dmData);
        break;
      }

      case '.cmpt': {
        this.writeCmptToGlbs(outputPath, assetUri, data);
        break;
      }
    }
  }

  private async writeCmptToGlbs(outputPath: string, assetUri: string, data: any) {
    const tiles = extractCmpt(data);

    const promises: Promise<void>[] = [];
    for (let i = 0; i < tiles.length; ++i) {
      const tile = tiles[i];
      const tileFormat = getTileFormat(tile);
      if (tileFormat === 'b3dm') {
        const b3dmData = extractB3dm(tile);
        promises.push(this.writeAssetToFeatureTableBatchTableAndGlb(outputPath, assetUri, b3dmData));
      } else if (tileFormat === 'i3dm') {
        const i3dmData = extractI3dm(tile);
        promises.push(this.writeAssetToFeatureTableBatchTableAndGlb(outputPath, assetUri, i3dmData));
      }
    }

    return Promise.all(promises);
  }

  private getCesiumModelType(assetPath: string | undefined): ModelType | undefined {
    let modelType: ModelType | undefined;
    if (!!assetPath) {
      const fileName = getFileNameFromPath(assetPath);
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
