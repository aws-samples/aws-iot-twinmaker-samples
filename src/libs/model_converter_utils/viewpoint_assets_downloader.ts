import axios from "axios";
import { ViewPoint, Image } from "./viewpoint"
import { TEMP_DIR } from "./const";
import * as fs from 'fs';

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
      await downloadImages(viewpoint.skyboxImages[i].path, localPath);
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

async function downloadImages(url: string, destFileName: string) {
  var out = fs.createWriteStream(destFileName);
  const response = await axios({
    method: "GET",
    url: url,
    responseType: "stream"
  });

  response.data.pipe(out);
}