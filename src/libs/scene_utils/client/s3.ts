// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2022
// SPDX-License-Identifier: Apache-2.0

import { createReadStream, readdirSync, readFileSync, statSync } from 'fs';
import { S3 } from 'aws-sdk';
import { basename, join } from 'path';
import { DeleteObjectRequest, PutObjectRequest } from 'aws-sdk/clients/s3';
import { parse } from 'path';
import { Parse } from 'unzipper';
import { PassThrough } from 'stream';

export class S3Client {
  private s3: S3;

  constructor() {
    this.s3 = new S3();
  }

  public async uploadModelRelatedFiles(bucketName: string, localPath: string) {
    await this.walkPath(localPath, bucketName);
  }

  private uploadFile(localFilePath: string, bucketName: string) {
    const fileName = basename(localFilePath);
    const params = {
      Bucket: bucketName,
      Key: fileName,
      Body: readFileSync(localFilePath),
    };
    const putObjectRequest = this.s3.putObject(params, (err, data) => {
      if (err) {
        throw err;
      } else {
        console.log(`Successfully uploaded ${fileName} to ${bucketName}`);
      }
    });
    
    return putObjectRequest.promise();
  }

  private streamFile(filePath: string, bucketName: string) {
    const pass = new PassThrough();
    const params = {
      Bucket: bucketName,
      Key: filePath,
      Body: pass,
    }

    const promise = this.s3.upload(params, (err, data) => {
      if (err) {
        throw err;
      }
    }).promise();

    return { pass, promise };
  }

  // Assumes a compressed folder with no sub-folders
  private async unZipAndUpload(zipFilePath: string, bucketName: string): Promise<void> {
    const key = parse(zipFilePath).name;
    const stream = createReadStream(zipFilePath).pipe(Parse({forceStream: true}));

    console.log('Uploading uncompressed zip to S3');

    // Wait for all S3 uploads to finish
    const openStreams: any[] = [];
    for await (const entry of stream) {
      const { pass, promise } = this.streamFile(`${key}/${entry.path}`, bucketName);
      entry.pipe(pass);
      openStreams.push(promise);
    }

    await Promise.allSettled(openStreams);

    console.log('Finished uploading uncompressed zip to S3');
  }

  private async walkPath(currentPath: string, bucketName: string): Promise<void> {
    const stat = statSync(currentPath);
    if (stat.isFile()) {
      if (parse(currentPath).ext.toLowerCase() === '.zip') {
        await this.unZipAndUpload(currentPath, bucketName);
      } else {
        await this.uploadFile(currentPath, bucketName);
      }
    } else if (stat.isDirectory()) {
      const files: string[] = readdirSync(currentPath);

      for (const fileName of files) {
        const filePath = join(currentPath, fileName);
        await this.walkPath(filePath, bucketName);
      }
    }
  }

  public async doesFileExist(bucketName: string, remotePath: string): Promise<boolean> {
    const params = {
      Bucket: bucketName,
      Key: remotePath,
    };

    try {
      await this.s3.headObject(params).promise();
      return true;
    } catch (error) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  public async uploadScene(bucketName: string, sceneId: string, sceneContent: string): Promise<void> {
    const request: PutObjectRequest = {
      Bucket: bucketName,
      Key: `${sceneId}.json`,
      Body: Buffer.from(sceneContent, 'utf8'),
      CacheControl: 'no-cache',
    };
    await this.s3.putObject(request).promise();
  }

  public async deleteScene(bucketName: string, sceneId: string): Promise<void> {
    const request: DeleteObjectRequest = {
      Bucket: bucketName,
      Key: `${sceneId}.json`,
    };
    await this.s3.deleteObject(request).promise();
  }

  public async loadSceneFileFrom(bucketName: string, sceneId: string): Promise<string> {
    const params = {
      Bucket: bucketName,
      Key: `${sceneId}.json`,
    };
    const response = await this.s3.getObject(params).promise();
    return JSON.stringify(response.Body?.toString());
  }

  public async uploadData(bucketName: string, uploadPath: string, data: any) {
    const params = {
      Bucket: bucketName,
      Key: uploadPath,
      Body: data,
    };
    this.s3.putObject(params, (err, data) => {
      if (err) {
        throw err;
      }
    });
  }
}
