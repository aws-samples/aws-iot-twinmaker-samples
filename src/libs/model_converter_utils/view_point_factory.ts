import { posix } from "path/posix";
import { Image, ViewPoint } from "./viewpoint";

export function generateViewPointsFromMatterPortData(matterportData: any, modelId: string) : ViewPoint[] {
  var panoLocations = matterportData["data"]["model"]["panoLocations"];
  var viewPoints: ViewPoint[] = [];

  for (var i = 0; i < panoLocations.length; i++) {
    var skybox = panoLocations[i]["skybox"];
    var rotation = skybox["perspective"]["rotation"];
    var position = skybox["anchor"]["position"];
    var viewpoint: ViewPoint = {
      modelId: modelId,
      id: `viewpoint${i}`,
      name: `viewpoint${i}`,
      position: [position.x, position.y, position.z],
      rotation: toEulerAngles(rotation.x, rotation.y, rotation.z, rotation.w),
      skyboxImages: constructImages(skybox["children"]),
      floorOffset: skybox["perspective"]["position"]
    }

    viewPoints.push(viewpoint);
  }

  return viewPoints;
}

// yaw (Z), pitch (Y), roll (X)
function toEulerAngles(x: number, y: number, z: number, w: number): number[] {
      // roll (x-axis rotation)
    const sinr_cosp: number = 2 * (w * x + y * z);
    const cosr_cosp: number = 1 - 2 * (x * x + y * y);
    var x = Math.atan2(sinr_cosp, cosr_cosp);

    // pitch (y-axis rotation)
    const sinp: number = 2 * (w * y - z * x);
    var y = 0;
    if (Math.abs(sinp) >= 1) {
      y = Math.PI / 2 * Math.sign(sinp); // use 90 degrees if out of range
    } else {
      y = Math.asin(sinp);
    }

    // yaw (z-axis rotation)
    var siny_cosp = 2 * (w * z + x * y);
    var cosy_cosp = 1 - 2 * (y * y + z * z);
    var z = Math.atan2(siny_cosp, cosy_cosp);

    return [x, y, z];
}

function constructImages(urls: string[]): Image[] {
  var images: Image[] = [];

  for (var url of urls) {
    images.push({
      path: url,
      fileName: "fromMatterport"
    })
  }

  return images;
}