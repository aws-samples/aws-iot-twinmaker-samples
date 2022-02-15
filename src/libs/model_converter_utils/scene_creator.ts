import { sign } from "aws4";
import axios, { Method, AxiosRequestConfig } from "axios";
import * as AWS from "aws-sdk"
import * as fs from "fs"
import { TEMP_DIR, TEMP_ZIP } from "./const";
import { downViewPointAssets } from "./viewpoint_assets_downloader";
import { generateViewPointsFromMatterPortData } from "./view_point_factory"
import {ViewPoint, Image } from "./viewpoint"

export async function createScene(modelName: string, workspace: string, region: string, matterportData: any) {

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

  const bucketName = JSON.parse(JSON.stringify(getWorkspaceResponse))["s3Location"].split(":").at(-1);
  console.log("generating scene file...");
  var sceneTemplate = JSON.parse(fs.readFileSync("scene_template.json").toString());
  const modelFileName = `${modelName}.glb`;
  const modelTargetedUri = `s3://${bucketName}/${modelFileName}`;

  var childrenIndex = [];
  const tags = [];

  const mattertags = matterportData["data"]["model"]["mattertags"];
  const viewpoints = generateViewPointsFromMatterPortData(matterportData, modelName);

  const copiedViewPoints = await downViewPointAssets(viewpoints);

  // converting mattertag to scene composer tag.
  for (var i = 2; i <= mattertags.length + 1; i++) {
    childrenIndex.push(i);
    const mattertag = mattertags[i - 2] as any;
    const anchorPosition = mattertag["anchorPosition"] as any;
    tags.push({
      "name": `${mattertag["label"]}`,
      "transform":{
        "position":[
          anchorPosition["x"],
          anchorPosition["y"],
          anchorPosition["z"]
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
      var remotePath = `${copiedViewpoint.modelId}/${copiedViewpoint.id}/${image.fileName}`;
      uploadToS3(image.path, bucketName, remotePath);
      skyboxImagesUri.push(`s3://${bucketName}/${remotePath}`);
    }
    sceneCoomposerViewPoints.push({
      "name": copiedViewpoint.name,
      "id": copiedViewpoint.id,
      "transform":{
        "position":copiedViewpoint.position,
        "rotation":copiedViewpoint.rotation,
        "scale":[1, 1, 1]
      },
      "transformConstraint":{
      },
      "components":[{
        "type":"Viewpoint",
        "skyboxImages": skyboxImagesUri,
        "floorOffset": copiedViewpoint.floorOffset,
        "skyboxImageFormat": "SixSided",
        "visibleObjectIDs": [] // TODO, calculate the visible object ids
      }
      ]
    });
  }

  const modelNode = {
    "name": `${ modelName }`,
    "transform": {
      "position": [0, 2.8, 0],
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

  const rootNode = {
    "name": 'Model',
    "transform": {
      "position": [0, 0, 0],
      "rotation": [-Math.PI/2, 0, 0],
      "scale": [1, 1, 1]
    },
    "children": [1],
  }

  // insert model and tag nodes to scene
  var nodes = sceneTemplate["nodes"];
  nodes.push(rootNode);
  nodes.push(modelNode);
  nodes = nodes.concat(tags);
  nodes = nodes.concat(sceneCoomposerViewPoints);
  sceneTemplate["nodes"] = nodes;
  sceneTemplate["rootNodeIndexes"] = [0];
  const sceneId = `${modelName}_scene`;
  const sceneFileName = `${sceneId}.json`;
  fs.writeFileSync(`./model/${sceneFileName}`, JSON.stringify(sceneTemplate));
  uploadToS3(`./model/${modelFileName}`, bucketName, modelFileName);
  uploadToS3(`./model/${sceneFileName}`, bucketName, sceneFileName);

  console.log("finished uploading model and scene files to S3 bucket.");

  console.log("Creating scene...");
  const createSceneRequestData = {
    "workspaceId": workspace,
    "sceneId": `${sceneId}`,
    "contentLocation": `s3://${bucketName}/${sceneFileName}`,
    "description": `scene created by local script.`
  }

  await sendRequest("POST", `/workspaces/${workspace}/scenes`, createSceneRequestData, region);

  console.log("Finished Creating scene.");
  console.log("Cleaning temp files...");
  fs.rmSync(TEMP_DIR, {recursive: true, force: true});

  console.log("Finished cleanup.")
  console.log(`https://console.aws.amazon.com/iottwinmaker/home?region=${region}#/workspaces/${workspace}/scenes/${sceneId}`);
}

function uploadToS3(localPath: string, bucketName: string, remotePath: string) {
    // upload the model to S3 bucket
    const modelReadStream = fs.createReadStream(localPath);

    const params = {
      Bucket: bucketName,
      Key: remotePath,
      Body: modelReadStream
    };
  
    const s3Bucket = new AWS.S3();
  
    console.log(`start uploading file ${localPath} to S3:` + bucketName);
    s3Bucket.upload(params, (err: any, data: any) => {
      modelReadStream.destroy();
      if (err) {
        console.error("failed to upload model file to S3 due to", err);
        throw err;
      }
    });
    console.log(`finished uploading file ${localPath} to bucket ${bucketName}`);
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