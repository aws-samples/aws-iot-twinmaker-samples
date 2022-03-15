
import * as AWS from "aws-sdk";
import * as fs from "fs";

export async function uploadToS3(localPath: string, bucketName: string, remotePath: string) {
  // upload the model to S3 bucket
  const modelReadStream = fs.createReadStream(localPath);

  const params = {
    Bucket: bucketName,
    Key: remotePath,
    Body: modelReadStream
  };

  const s3Bucket = new AWS.S3();

  try {
    return s3Bucket.upload(params).promise();
  } catch (err) {
    throw err;
  }
}