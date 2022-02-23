import { ViewPoint, Image } from "./viewpoint"
import { TEMP_DIR } from "./const";
import * as fs from 'fs';
import * as Jimp from "jimp";

const toIotTwinMakerAxisImageMapper = [1, 3, 0, 5, 4, 2]; // x+, x-, y+, y-, z+, z-

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
      const rotationDegree: number = (i === 2 ? 90 : (i === 3 ? 270 : 0));
      await downloadImages(viewpoint.skyboxImages[toIotTwinMakerAxisImageMapper[i]].path, localPath, rotationDegree);
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

async function downloadImages(url: string, destFileName: string, rotationDegree: number) {
  const image = await Jimp.read(url);
  image.rotate(rotationDegree).write(destFileName);
}