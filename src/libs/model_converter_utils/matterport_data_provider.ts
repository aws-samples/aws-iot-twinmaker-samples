import axios from "axios";
import { getParameters, MatterportParameters } from "./parameters_reader";

export async function getAllMatterportMetadata() {

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
  var response = await axios.post(url, {
    "query": `query($id: ID!) {
      model(id: $id) {
        name
        mattertags {
          anchorPosition {x y z}
          label
        }

        panoLocations {
          skybox(resolution: "2k") {
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
  }, {"headers": headers, "auth": auth});

  return response.data;
}

export async function getPanoLocations(): Promise<[]> {
  // recall matterport API to prevent cdn link expire.
  const response = await getAllMatterportMetadata();
  if (!response.data || !response.data.model || response.data.panoLocations) {
    throw new Error(JSON.stringify(response["errors"]));
  }

  return response["data"]["model"]["panoLocations"];
}

