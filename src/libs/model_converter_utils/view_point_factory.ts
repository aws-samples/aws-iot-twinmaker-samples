import { posix } from "path/posix";
import { getPanoLocations } from "./matterport_data_provider";
import { Image, ViewPoint } from "./viewpoint";
import { getParameters, MatterportParameters } from "./parameters_reader";

export async function generateViewPointsFromMatterPortData() : Promise<ViewPoint[]> {
  
  var panoLocations = await getPanoLocations();
  var parameters: MatterportParameters = await getParameters(); 
  var viewPoints: ViewPoint[] = [];
  const VIEWPOINT_FLOOR_OFFSET = 0.03;

  for (var i = 0; i < panoLocations.length; i++) {
    var skybox = panoLocations[i]["skybox"];
    var rotation = skybox["perspective"]["rotation"] as any;
    var position = skybox["anchor"]["position"] as any;
    var floorOffset = skybox["perspective"]["position"] as any;
    var computedRotation = toEulerAngles(rotation.x, rotation.y, rotation.z, rotation.w);
    var viewpoint: ViewPoint = {
      modelId: parameters.modelId,
      id: `viewpoint${i}`,
      name: `viewpoint${i}`,
      // rotate the point through x axis by -90 degree
      position: [position.x, position.z + VIEWPOINT_FLOOR_OFFSET, -position.y],
      cameraRotation: [computedRotation[0], computedRotation[2], -computedRotation[1]],
      skyboxImages: constructImages(skybox["children"]),
      cameraPosition: [floorOffset.x, floorOffset.z, -floorOffset.y]
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