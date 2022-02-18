import axios from "axios";
import * as https from "https";
import { writeFileSync, createWriteStream } from 'fs';
import { createScene } from "./scene_creator";
import * as AdmZip from "adm-zip";
import * as fs from "fs";
import { getParameters, MatterportParameters } from "./parameters_reader";
import { TEMP_DIR, TEMP_ZIP } from "./const"

const obj2gltf = require("obj2gltf");

const destinationDir = "./model";

async function queryMatterPortApi() {

  var parameters: MatterportParameters = await getParameters();

  var url = "https://api.matterport.com/api/models/graph";
  var headers = {
    "Content-Type": "application/json",
    "Accept": "gzip"
  }

  var auth = {
    "username": parameters.matterportApiToken,
    "password": parameters.matterportApiSecret
  }

  var response = axios.post(url, {
    "query": `query($id: ID!) {
      model(id: $id) {
        name
        mattertags {
          anchorPosition {x y z}
          label
        }

        panoLocations {
          skybox(resolution: "high") {
            url
            urlTemplate
            children
            anchor {
              position {
                x y z
              }
            }
            perspective {
              position {
                x y z
              }
              rotation {
                x y z w
              }
            }
          }
        }

        locations {
          position {
            x y z
          }
        }
        assets {
          resources {
            url
          }
        }
      }
    }`,
    "variables": {"id": parameters.modelId},
  }, {"headers": headers, "auth": auth}).then(res => {
    processResponse(res.data, parameters);
  }).catch(error => {
    console.log(error)
  });
  
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

  zip.extractAllTo(destinationDir);

  console.log("Finish extracting resource files, start converting model...");
  const options = {
    binary: true
  };
  const modelFile = findModelFile("./model");
  const convertedModelFileName = parameters.modelId;
  
  obj2gltf(`./model/${modelFile}`, options).then((glb: any) => {
    writeFileSync(`${destinationDir}/${convertedModelFileName}.glb`, glb);
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

