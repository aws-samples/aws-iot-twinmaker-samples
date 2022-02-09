import axios from "axios";
import * as https from "https";
import { writeFileSync, createWriteStream } from 'fs';
import { createScene } from "./scene_creator";
import * as AdmZip from "adm-zip";
import * as fs from "fs";
import { getParameters, MatterportParameters } from "./parameters_reader";
import { getAllMatterportMetadata } from "./matterport_data_provider"

import { TEMP_DIR, TEMP_ZIP } from "./const"

const obj2gltf = require("obj2gltf");

async function queryMatterPortApi() {
  const response = await getAllMatterportMetadata();
  var parameters: MatterportParameters = await getParameters();
  await processResponse(response, parameters);
}

async function processResponse(matterportData: any, parameters: MatterportParameters) {
  if (!matterportData["data"]["model"]) {
    throw new Error(JSON.stringify(matterportData["errors"]));
  }
  var resources = matterportData["data"]["model"]["assets"]["resources"];
  var modelExisted = false;

  for (var resource of resources) {
    if(resource["url"]) {
      downloadFileAndConvert(resource["url"], matterportData, parameters);
      modelExisted = true;
      break;
    }
  }

  if (!modelExisted) {
    throw new Error("matter park model cannot be found, please go to https://my.matterport.com/ to purchase it firstly.");
  }
}

function findModelFile(path: string): string {
  var targetedFile = ".obj";
  var files = fs.readdirSync(path);
  for (var file of files) {
    if (file.endsWith(".obj")) {
      targetedFile = file;
      break;
    }
  }
  return targetedFile;
}

async function downloadFileAndConvert(url: string, matterportData: any, parameters: MatterportParameters) {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR);
  }
  var tempFile = `${TEMP_DIR}/${TEMP_ZIP}`;
  var out = createWriteStream(`${tempFile}`);
  out.on("finish", () => {
    console.log("Finished dowloading.");
    unzip(`${tempFile}`, matterportData, parameters);
  });
  console.log("Downloading model related files...");
  https.get(url, (response) => {
    response.pipe(out);
  });
}

async function unzip(zipFile: string, matterportData: any, parameters: MatterportParameters) {
  console.log("Starting unzip files...");
  const zip = new AdmZip(zipFile);

  zip.extractAllTo(TEMP_DIR);

  console.log("Finish extracting resource files, start converting model...");
  const options = {
    binary: true,
    inputUpAxis: "Z",
    outputUpAxis: "Y",
  };
  const modelFile = findModelFile(TEMP_DIR);
  const convertedModelFileName = parameters.modelId;
  
  obj2gltf(`${TEMP_DIR}/${modelFile}`, options).then((glb: any) => {
    writeFileSync(`${TEMP_DIR}/${convertedModelFileName}.glb`, glb);
    console.log("Finished converting.");
    if (!parameters.region) {
      console.warn("region is not set, default to us-east-1");
    }
    const modelName = matterportData["data"]["model"]["name"];

    createScene(modelName, parameters.modelId, parameters.workspaceId, parameters.region ? parameters.region : "us-east-1", 
      matterportData);
  });
}

queryMatterPortApi();
