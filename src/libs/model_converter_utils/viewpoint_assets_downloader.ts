import { ViewPoint, Image } from "./viewpoint"
import { TEMP_DIR } from "./const";
import * as fs from 'fs';
import * as Jimp from "jimp";

const toIotTwinMakerAxisImageMapper = [3, 1, 0, 5, 2, 4]; // x+, x-, y+, y-, z+, z-

export async function downloadViewPointAssets(viewpoints: ViewPoint[]): Promise<ViewPoint[]> {
  var copiedViewPoints: ViewPoint[] = [];
  for (var viewpoint of viewpoints) {
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
      const isYAxisImage: boolean = (i === 2 || i === 3);
      await downloadImages(viewpoint.skyboxImages[toIotTwinMakerAxisImageMapper[i]].path, localPath, isYAxisImage);
    } 

    copiedViewPoints.push({
      modelId: viewpoint.modelId,
      id: viewpoint.id,
      name: viewpoint.name,
      position: viewpoint.position,
      rotation: viewpoint.rotation,
      skyboxImages: images,
      floorOffset: viewpoint.floorOffset
    })
  }

  return copiedViewPoints;
}

async function downloadImages(url: string, destFileName: string, isYAxisImage: boolean) {
  const image = await Jimp.read(url);

  if (isYAxisImage) {
    image.rotate(270).write(destFileName);
  } else {
    image.write(destFileName);
  }
}