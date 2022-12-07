// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2022
// SPDX-License-Identifier: Apache-2.0

import { readdirSync, readFileSync, statSync } from 'fs';
import { S3 } from 'aws-sdk';
import { basename, join } from 'path';
import { DeleteObjectRequest, PutObjectRequest } from 'aws-sdk/clients/s3';

export class S3Client {
  private s3: S3;

  constructor() {
    this.s3 = new S3();
  }

  public async uploadModelRelatedFiles(bucketName: string, localPath: string) {
    this.walkSync(localPath, bucketName);
  }

  private uploadFile(localFilePath: string, bucketName: string) {
    const fileName = basename(localFilePath);
    const params = {
      Bucket: bucketName,
      Key: fileName,
      Body: readFileSync(localFilePath),
    };
    this.s3.putObject(params, (err, data) => {
      if (err) {
        throw err;
      } else {
        console.log(`Successfully uploaded ${fileName} to ${bucketName}`);
      }
    });
  }

  private walkSync(currentPath: string, bucketName: string): void {
    const stat = statSync(currentPath);
    if (stat.isFile()) {
      this.uploadFile(currentPath, bucketName);
    } else if (stat.isDirectory()) {
      const files: string[] = readdirSync(currentPath);

      for (const fileName of files) {
        const filePath = join(currentPath, fileName);
        this.walkSync(filePath, bucketName);
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
