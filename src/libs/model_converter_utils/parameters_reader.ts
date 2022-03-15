import * as fs from "fs";
import * as reader from "readline";
import { 
  WORKSPACE_ID, 
  SETTING_FILE, 
  MATTERPORT_API_SECRET, 
  MATTERPORT_API_TOKEN, 
  REGION, 
  MODEL_ID
} from "./const"

type MatterportParameters = {
  modelId: string;
  workspaceId: string;
  matterportApiToken: string;
  matterportApiSecret: string;
  region?: string;
}

var modelId: string = "";
var workspaceId: string = "";
var apiToken: string = "";
var apiSecret: string = "";
var region: string = "";

async function getParameters(): Promise<MatterportParameters> {
  const parameters = process.argv.slice(2);

  for (var i = 0; i < parameters.length; i = i + 2) {
    checkValue(parameters, i);
    var parameter = parameters[i].slice(2);
    var parameterValue = parameters[i + 1];
    setParameterValue(parameter, parameterValue);
  }

  // reading parematers setting from file
  await readFromSettingFile();
  if (!allParametersValueFilled()) {
    throw new Error(`Parameters ${MODEL_ID} ${WORKSPACE_ID} ${MATTERPORT_API_TOKEN} ${MATTERPORT_API_SECRET} are required for importing matterport model.`);
  }

  return {
    workspaceId: workspaceId,
    modelId: modelId,
    matterportApiSecret: apiSecret,
    matterportApiToken: apiToken,
    region: region
  }
}

async function readFromSettingFile() {
  if (!allParametersValueFilled() && fs.existsSync(SETTING_FILE)) {
    console.log(`Reading parameters value from ${SETTING_FILE} file...`);
    const fileStream = fs.createReadStream(SETTING_FILE);
    const rl = reader.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    for await(const line of rl) {
      var segments = line.trim().split("=");
      if (segments.length == 2) {
        setParameterValue(segments[0], segments[1])
      }
    }
  }
}

function checkValue(parameters: string[], index: number) {
  if (index + 1 >= parameters.length) {
    throw new Error(`Expecting value after argument ${parameters[index]}`)
  }
}

function allParametersValueFilled() : boolean {
  if (modelId && workspaceId && apiToken && apiSecret) {
    return true;
  }
  return false;
}

function setParameterValue(parameter: string, parameterValue: string) {
  parameter = parameter.trim();
  parameterValue = parameterValue.trim();
  if (parameter == MODEL_ID && !modelId) {
    modelId = parameterValue;
  } else if (parameter == WORKSPACE_ID && !workspaceId) {
    workspaceId = parameterValue;
  } else if (parameter == MATTERPORT_API_TOKEN && !apiToken) {
    apiToken = parameterValue;
  } else if (parameter == MATTERPORT_API_SECRET && !apiSecret) {
    apiSecret = parameterValue;
  } else if (parameter == REGION && !region) {
    region = parameterValue;
  }
}

export {getParameters, MatterportParameters}