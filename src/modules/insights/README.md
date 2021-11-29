# AWS IoT TwinMaker Insights

## Summary

The module provides a sample integration with simulation functionality via Maplesoft, as well as a sample integration with a pretrained machine learning model for anomaly detection (using the sample data in the Cookie Factory). 

It deploys the following 2 stacks:

* CookieFactorySageMakerStack - Deploys two SageMaker endpoints, one as a sample simulation service for running MapleSoft simulation, the other as an inference endpoint using a pretrained anomaly detection model. Both endpoints accept HTTP POST requests. See a sample request in the "Test SageMaker Endpoints" section below. 
* CookieFactoryKdaStack - Contains a KDA Studio notebook application configured with the AWS IoT TwinMaker connector library. In this notebook you can write Flink SQL streaming applications against AWS IoT TwinMaker data sources. The notebook application also interacts with the simulation/anomaly detection features hosted in SageMaker.

Please note that the KDA notebook may incur AWS charges, so we recommend that you stop the instance when it is not needed.

## Prerequisites

* (optional) Install [awscurl](https://github.com/okigan/awscurl) to test simulation service or ML inference directly.

---

## Setup / Test

1. Set environment variables for convenience.
  - Change to the directory of this README
    ```
    cd [where this README is]
    ```
  - Set directory for later instructions.
    ```
    INSIGHT_DIR=$PWD
    ```
  - Set stack names
    ```
    export KDA_STACK_NAME=CookieFactoryKdaStack
    export SAGEMAKER_STACK_NAME=CookieFactorySageMakerStack
    ```  
2. Deploy Insights-related stacks.
  - Change directory.
    ```
    cd $INSIGHT_DIR/cdk
    ```
  - Install cdk dependencies.
    ```
    npm install
    ```
  - deploy stacks using cdk (answer `y` to accept IAM changes when prompted)
    ```
    cdk deploy --all
    ```
  - Note the SageMaker Endpoint Names that the cdk command will output once finished (output called `SageMakerEndpointNames`). The value will look similar to these: `SimulationEndpoint-IkxImigGVK6i` for simulation, and `AnomalyDetectionEndpoint-ZS4j48mRF3zR` for anomaly detection.
3. (Optional) Test SageMaker Endpoints.
  - Test Simulation Service.
    - Set environment variables for convenience.
      ```
      export SIMULATION_ENDPOINT_NAME=[fill in your endpoint name]
      export ENDPOINT_URL=https://runtime.sagemaker.${AWS_DEFAULT_REGION}.amazonaws.com/endpoints/${SIMULATION_ENDPOINT_NAME}/invocations
      ```
    - Send test request against Maplesoft simulation running in Sagemaker.
      ```
      awscurl --service sagemaker -X POST -H "Content-Type: application/json" -d '{           
        "inputs": {
          "RPM": 50
        },
        "end_time": 1633396537
      }' $ENDPOINT_URL
      ```
      The response should look something like the following: ```{"end_time": 163339673, "outputs": {"Power": 78.31207971087645}}```.

  - Test Anomaly Detection.
    - Set environment variables for convenience.
      ```
      export AD_ENDPOINT_NAME=[fill in your endpoint name]
      export AD_ENDPOINT_URL=https://runtime.sagemaker.${AWS_DEFAULT_REGION}.amazonaws.com/endpoints/${AD_ENDPOINT_NAME}/invocations
      ```
    - Send test request against Maplesoft simulation running in Sagemaker.
      ```
      awscurl --service sagemaker -X POST -H "Content-Type: application/json" -d '{"instances": [{"features": [58.00]}]}' $AD_ENDPOINT_URL
      ```
      The response should look something like the following: ```{"scores":[{"score":1.019143498}]}```.    
4. Set up KDA Studio, SiteWise resources for insights
  - Start and bootstrap KDA notebook. (Notebook startup can take ~5 minutes.)
    ```
    cd $INSIGHT_DIR
    ```
    ```
    python3 $INSIGHT_DIR/install_insights_module.py --workspace-id $WORKSPACE_ID --region-name $AWS_DEFAULT_REGION --import-all
    ```
  - Navigate to the link output by the preceding command. (This may contain a long pre-signed url token). Please copy the full length of link output.
  - Update the paragraphs in the maple as needed:
    - update the timestamp in the `CREATE TABLE` call if needed based on when your data was ingested.
  - Execute all the paragraphs sequentially in the notebook to see simulation data streamed from AWS IoT TwinMaker into the Maplesoft simulation and results outputed to the notebook.

## Set up AWS IoT TwinMaker Insight Dashboard
This section should be similar to setting up the main Cookie Factory dashboard described in [GettingStarted/README.md](../../../README.md). If you have aleady finished setting up the main Cookie Factory dashboard. You can skip step 1 below.
1.    AWS IoT TwinMaker provides a Grafana plugin that allows you to build dashboards using IoT TwinMaker scenes and modeled data sources. Grafana is deployable as a docker container. We recommend that new users follow these instructions to set up Grafana as a local container: [Instructions](./docs/grafana_local_docker_setup.md) (If this link does'nt work in Cloud9, open `docs/grafana_local_docker_setup.md`.)
      
      For advanced users aiming to set up a production Grafana installation in their account, we recommend checking out https://github.com/aws-samples/aws-cdk-grafana.
2. Import Grafana dashboards for the Cookie Factory.

    Once you have the Grafana page open, you can click through the following to import the following sample dashboard json files in `$INSIGHT_DIR/sample_data/sample_dashboards`.

    * aws_iot_twinmaker_insights_dashboard.json
  
## Adding User-Defined Functions (UDF)
You can register your own User-Defined Functions (UDF) for other type of service integrations in the KDA notebook (for more information on Flink UDF, see https://nightlies.apache.org/flink/flink-docs-release-1.13/docs/dev/table/functions/udfs/). 

The following code snippet is an example of how to write Simulation Function, which is used in this demo. It takes RPM as an input at an timestamp and output the simulated instantaneous power (in Watts) consumed by the machine.
```
import org.apache.flink.util.FlinkRuntimeException；
import com.amazonaws.services.sagemakerruntime.AmazonSageMakerRuntime;
import com.amazonaws.services.sagemakerruntime.AmazonSageMakerRuntimeClient;
import com.amazonaws.services.sagemakerruntime.model.InvokeEndpointRequest;
import com.amazonaws.services.sagemakerruntime.model.InvokeEndpointResult;
import lombok.extern.log4j.Log4j2;
import org.apache.flink.table.functions.FunctionContext;
import org.apache.flink.table.functions.ScalarFunction;
import org.json.JSONObject;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Log4j2
public class SageMakerMixerSimulationFunction extends ScalarFunction {
    private static final String REGION_KEY = “aws.region”;
    private static final String ENDPOINT_NAME_KEY = “sagemaker.endpoint.name”;
    private static final String CONTENT_TYPE_KEY = “sagemaker.endpoint.contentType”;
    private static final String DEFAULT_CONTENT_TYPE = “application/json”;
    private static final String POWER_KEY = “Power”;
    private static final String DEFAULT_VALUE = “default”;

    private static final String SAGEMAKER_REQUEST_FORMAT = “{\“inputs\“: {\“RPM\“: %f}, \“end_time\“: %d}“;

    private String endpointName;
    private String contentType;
    private AmazonSageMakerRuntime sageMakerClient;

    @Override
    public void open(FunctionContext context) {
        // access Flink global configuration
        String region = context.getJobParameter(REGION_KEY, DEFAULT_VALUE);
        endpointName = context.getJobParameter(ENDPOINT_NAME_KEY, DEFAULT_VALUE);
        if (DEFAULT_VALUE.equals(region) || DEFAULT_VALUE.equals(endpointName)) {
            String errorMsg = String.format(“%s and %s must be provided to run the simulation UDF”, REGION_KEY, ENDPOINT_NAME_KEY);
            log.error(errorMsg);
            throw new FlinkRuntimeException(errorMsg);
        }
        contentType = context.getJobParameter(CONTENT_TYPE_KEY, DEFAULT_CONTENT_TYPE);
        sageMakerClient = AmazonSageMakerRuntimeClient.builder()
                .withRegion(region)
                .build();
    }


    /**
     *
     * @param time record timestamp
     * @param rpm mixer RPM
     * @rsrividh Map of “Power” key, and the simulated power value. Defaults to 0 when exception happens
     */
    public Map<String, Double> eval(Integer time, Double rpm) {
        final String requestBody = String.format(SAGEMAKER_REQUEST_FORMAT, rpm.floatValue(), time);

        final InvokeEndpointRequest invokeEndpointRequest = new InvokeEndpointRequest()
                .withAccept(contentType)
                .withContentType(contentType)
                .withEndpointName(endpointName)
                .withBody(ByteBuffer.wrap(requestBody.getBytes(StandardCharsets.UTF_8)));
        Map<String, Double> result = new HashMap<>();
        result.put(POWER_KEY, 0.0);
        try {
            final InvokeEndpointResult invokeEndpointResponse = sageMakerClient.invokeEndpoint(invokeEndpointRequest);

            String output = StandardCharsets.UTF_8.decode(invokeEndpointResponse.getBody()).toString();
            JSONObject jsonObject = new JSONObject(output);

            result.put(POWER_KEY, jsonObject.getJSONObject(“outputs”).getDouble(POWER_KEY));
            log.info(String.format(“Get simulated power result from SageMaker, time: %d, rpm: %f, power: %f.“, time, rpm, result.get(POWER_KEY)));
        } catch (final Exception e) {
            log.warn(“Got simulation exception, using 0 as the simulated value, continue the application”, e);
        }
        return result;
    }
}
```  

## Cleanup

1. Go to CloudFormation console and delete the 2 stacks.
2. Run scripts to delete SiteWise components created for anomaly detection and simulation.
```
python3 $INSIGHT_DIR/install_insights_module.py --workspace-id $WORKSPACE_ID --region-name $AWS_DEFAULT_REGION --delete-all
```

---

## License

This project is licensed under the Apache-2.0 License.