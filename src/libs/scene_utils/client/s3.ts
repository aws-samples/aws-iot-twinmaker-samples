import { readdirSync, readFileSync, statSync } from 'fs';
import { S3 } from 'aws-sdk';
import { String } from 'aws-sdk/clients/appstream';
import { join } from 'path';
import { DeleteObjectRequest, PutObjectRequest } from 'aws-sdk/clients/s3';

export class S3Client {
  private s3: S3;

  constructor() {
    this.s3 = new S3();
  }

  public async uploadModelRelatedFiles(bucketName: string, localDirectoryPath: string) {
    this.uploadDir(localDirectoryPath, bucketName);
  }

  private uploadDir(localDirectoryPath: string, bucketName: string): void {
    this.walkSync(localDirectoryPath, bucketName);
  }

  private uploadFile(dirPath: string, localFilePath: string, bucketName: string) {
    let bucketPath = localFilePath.substring(dirPath.length + 1);
    let params = {
      Bucket: bucketName,
      Key: bucketPath,
      Body: readFileSync(localFilePath),
    };
    this.s3.putObject(params, (err, data) => {
      if (err) {
        throw err;
      } else {
        console.log(`Successfully uploaded ${bucketPath} to ${bucketName}`);
      }
    });
  }

  private walkSync(currentDirPath: String, bucketName: string): void {
    const files: string[] = readdirSync(currentDirPath);

    for (const fileName of files) {
      var filePath = join(currentDirPath, fileName);
      var stat = statSync(filePath);
      if (stat.isFile()) {
        this.uploadFile(currentDirPath, filePath, bucketName);
      } else if (stat.isDirectory()) {
        this.walkSync(filePath, bucketName);
      }
    }
  }

  public async doesFileExist(bucketName: string, remotePath: string): Promise<boolean> {
    var params = {
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
