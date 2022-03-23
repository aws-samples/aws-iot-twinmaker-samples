import { sign } from "aws4";
import axios, { Method, AxiosRequestConfig } from "axios";
import { TEMP_DIR, TEMP_ZIP } from "./const";
import { downloadViewPointAssets } from "./viewpoint_assets_downloader";
import {Image, ViewPoint } from "./viewpoint"
import * as fs from "fs";
import { uploadToS3 } from "./s3_uploader";
import { buildRemotePath } from "./skybox_image_remote_path";

export async function createScene(modelName: string, modelId: string,
   workspace: string, region: string, matterportData: any) {

  // calling IotTwinMaker API to get workspace s3.
  // Sending request to create scene
  console.log("sending request to create scene...");
  var getWorkspaceResponse = await sendRequest("GET", 
    `/workspaces/${workspace}`,
    {},
    region
  );

  if (!JSON.parse(JSON.stringify(getWorkspaceResponse))["s3Location"]) {
    throw new Error(JSON.parse(JSON.stringify(getWorkspaceResponse))["message"]);
  }

  const s3LocationSegments = JSON.parse(JSON.stringify(getWorkspaceResponse))["s3Location"].split(":");

  const bucketName = s3LocationSegments[s3LocationSegments.length - 1];
  console.log("generating scene file...");
  var sceneTemplate = JSON.parse(fs.readFileSync("scene_template.json").toString());
  const modelFileName = `${modelId}.glb`;
  const modelTargetedUri = `s3://${bucketName}/${modelFileName}`;
  uploadToS3(`${TEMP_DIR}/${modelFileName}`, bucketName, modelFileName);

  var childrenIndex = [];
  const tags = [];

  const mattertags = matterportData["data"]["model"]["mattertags"];

  const copiedViewPoints = await downloadViewPointAssets(bucketName);

  // converting mattertag to scene composer tag.
  const tagStartindex = 1;
  for (var i = tagStartindex; i <= mattertags.length + tagStartindex - 1; i++) {
    childrenIndex.push(i);
    const mattertag = mattertags[i - tagStartindex] as any;
    const anchorPosition = mattertag["anchorPosition"] as any;
    tags.push({
      "name": `${mattertag["label"]}`,
      "properties": { alwaysVisible: false },
      "transform":{
        // rotate the point through x axis by -90 degree
        "position":[
          anchorPosition["x"],
          anchorPosition["z"],
          -anchorPosition["y"],
        ],
        "rotation":[0,0,0],
        "scale":[1, 1, 1]
    },
    "transformConstraint":{
    },
    "components":[{
        "type":"Tag"
      }
    ]
    })
  }

  // converting viewpoint to scene composer viewpoint
  var index = childrenIndex[childrenIndex.length - 1];
  const sceneCoomposerViewPoints = [];

  for (var i = 1; i <= copiedViewPoints.length; i++) {
    childrenIndex.push(index + i);
    var copiedViewpoint = copiedViewPoints[i - 1];
    var skyboxImagesUri = [];
    for (var j = 0; j < copiedViewpoint.skyboxImages.length; j++) {
      var image: Image = copiedViewpoint.skyboxImages[j];
      var remotePath = buildRemotePath(copiedViewpoint.modelId, 
        copiedViewpoint.id, image.fileName);
      skyboxImagesUri.push(`${remotePath}`);
    }
    sceneCoomposerViewPoints.push({
      "name": copiedViewpoint.name,
      "properties": { alwaysVisible: false },
      "id": copiedViewpoint.id,
      "transform":{
        "position":copiedViewpoint.position,
        "rotation":[0, 0, 0],
        "scale":[1, 1, 1]
      },
      "transformConstraint":{
      },
      "components":[{
        "type":"Viewpoint",
        "skyboxImages": skyboxImagesUri,
        "cameraPosition": copiedViewpoint.cameraPosition,
        "cameraRotation": copiedViewpoint.cameraRotation,
        "skyboxImageFormat": "SixSided",
      }
      ]
    });
  }

  const modelNode = {
    "name": `${ modelName }`,
    "properties": { hiddenWhileImmersive: true },
    "transform": {
      "position": [0, 0, 0],
      "rotation": [0, 0, 0],
      "scale": [1, 1, 1]
    },
    "children": childrenIndex,
    "components": [
      {    
        "type": "ModelRef",
        "uri": `${modelTargetedUri}`,
        "modelType": "GLB"
      }
    ]
  }

  // insert model and tag nodes to scene
  var nodes = sceneTemplate["nodes"];
  nodes.push(modelNode);
  nodes = nodes.concat(tags);
  nodes = nodes.concat(sceneCoomposerViewPoints);
  sceneTemplate["nodes"] = nodes;
  sceneTemplate["rootNodeIndexes"] = [0];
  const sceneId = `${modelId}_scene`;
  const sceneFileName = `${sceneId}.json`;
  const sceneFileLocalPath = `${TEMP_DIR}/${sceneFileName}`
  fs.writeFileSync(sceneFileLocalPath, JSON.stringify(sceneTemplate));
  console.log(`start uploading file ${sceneFileLocalPath} to S3:` + bucketName);
  await uploadToS3(sceneFileLocalPath, bucketName, sceneFileName);
  console.log(`finished uploading file ${sceneFileLocalPath} to S3:` + bucketName);

  console.log("Creating scene...");
  const createSceneRequestData = {
    "workspaceId": workspace,
    "sceneId": `${sceneId}`,
    "contentLocation": `s3://${bucketName}/${sceneFileName}`,
    "description": `scene created by local script.`
  }

  await sendRequest("POST", `/workspaces/${workspace}/scenes`, createSceneRequestData, region);
  console.log("Cleaning temp files...");
  fs.rmSync(TEMP_DIR, {recursive: true, force: true});
  console.log("Finished cleanup.")

  console.log("Finished Creating scene.");
  console.log(`https://console.aws.amazon.com/iottwinmaker/home?region=${region}#/workspaces/${workspace}/scenes/${sceneId}`);
}



function sendRequest(method: Method, path: string, requestData: any, region: string) {
  const requestOptions = getRequestOptions(method, path, requestData, region);
  const req = sign(requestOptions);

  return new Promise((resolve, reject) => {
    axios(req)
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        console.log(error);
        if (error.response) {
          console.log("error happening...");
          console.log(JSON.stringify(error.response));
        }
      })
  });
};

function getRequestOptions(method: Method, path: string, requestData: any, region: string) {
  const hostName = `api.iottwinmaker.${region}.amazonaws.com`;
  const headers = {
    "User-Agent": "LocalModelCreator",
    "content-type": "application/json"
  };

  //console.log(`https://${hostName}${path}`);
  return {
    hostname: hostName,
    method: method,
    path: path,
    data: requestData,
    body: JSON.stringify(requestData),
    url: `https://${hostName}${path}`,
    headers: headers,
    service: "iottwinmaker",
    region: region,
    validateStatus: () => true
  }
}

exports.createScene = createScene;