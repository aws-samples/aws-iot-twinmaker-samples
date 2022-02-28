import { ViewPoint, Image } from "./viewpoint"
import { TEMP_DIR } from "./const";
import * as fs from 'fs';
import * as Jimp from "jimp";
import { buildRemotePath } from "./skybox_image_remote_path";
import { generateViewPointsFromMatterPortData } from "./view_point_factory"
import { uploadToS3 } from "./s3_uploader";
import { getParameters, MatterportParameters } from "./parameters_reader";

const toIotTwinMakerAxisImageMapper = [1, 3, 0, 5, 2, 4]; // x+, x-, y+, y-, z+, z-

export async function downloadViewPointAssets(s3Bucket: string): Promise<ViewPoint[]> {
  var viewpoints = await generateViewPointsFromMatterPortData();
  var parameters: MatterportParameters = await getParameters();
  var copiedViewPoints: ViewPoint[] = [];
  const pageSize = 2;
  var pageEnd = Math.min(pageSize, viewpoints.length);
  var index = 0;

  while(index < pageEnd) {
    var promises = [];
    viewpoints = await generateViewPointsFromMatterPortData();
    while(index < pageEnd) {
      promises.push(downloadOneViewPointImage(viewpoints[index]));
      index++;
    }
    const returnedViewpoints = await Promise.all(promises);
    for (var viewpoint of returnedViewpoints) {
      const skyboxImages: Image[] = viewpoint.skyboxImages;
      for (var image of skyboxImages) {
        uploadToS3(image.path, s3Bucket, buildRemotePath(parameters.modelId, viewpoint.id, image.fileName));
      }
    }
    copiedViewPoints = copiedViewPoints.concat(returnedViewpoints);
    index = pageEnd;
    pageEnd = Math.min(viewpoints.length, pageEnd + pageSize);
  }

  return copiedViewPoints;
}

async function downloadOneViewPointImage(viewpoint: ViewPoint): Promise<ViewPoint> {
  var images: Image[] = [];
  for (var i = 0; i < viewpoint.skyboxImages.length; i++) {
    var fileName = `${viewpoint.name}_side${i}.jpg`;
    var directory = `${ TEMP_DIR }/${viewpoint.modelId}/${viewpoint.id}`;
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
    var localPath = `${ directory }/${fileName}`;
    images.push({
      fileName: fileName,
      path: localPath
    });
    const rotationDegree: number = (i === 2 ? 90 : (i === 3 ? 270 : 0));
    const flipVertical = (i === 2 || i === 3);
    await downloadImages(viewpoint.skyboxImages[toIotTwinMakerAxisImageMapper[i]].path, 
      localPath, rotationDegree, !flipVertical, flipVertical);
  } 

  return {
    modelId: viewpoint.modelId,
    id: viewpoint.id,
    name: viewpoint.name,
    position: viewpoint.position,
    cameraRotation: viewpoint.cameraRotation,
    skyboxImages: images,
    cameraPosition: viewpoint.cameraPosition
  }
}

async function downloadImages(url: string, destFileName: string, rotationDegree: number, horizontalFlip: boolean, 
  verticalFlip: boolean) {
  console.log("start downloading image from: " + url);
  const image = await Jimp.read(url);
  console.log("finish downloading image: " + url);
  image.rotate(rotationDegree).flip(horizontalFlip, verticalFlip).writeAsync(destFileName);
}