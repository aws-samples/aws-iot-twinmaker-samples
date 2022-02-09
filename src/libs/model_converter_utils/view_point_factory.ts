import { Image, ViewPoint } from "./viewpoint";

export function generateViewPointsFromMatterPortData(matterportData: any, modelId: string) : ViewPoint[] {
  var panoLocations = matterportData["data"]["model"]["panoLocations"];
  var viewPoints: ViewPoint[] = [];

  for (var i = 0; i < panoLocations.length; i++) {
    var skybox = panoLocations[i]["skybox"];
    var viewpoint: ViewPoint = {
      modelId: modelId,
      id: `viewpoint${i}`,
      name: `viewpoint${i}`,
      position: skybox["anchor"]["position"],
      rotation: skybox["perspective"]["rotation"],
      skyboxImages: constructImages(skybox["children"]),
      floorOffset: skybox["perspective"]["position"]
    }

    viewPoints.push(viewpoint);
  }

  return viewPoints;
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