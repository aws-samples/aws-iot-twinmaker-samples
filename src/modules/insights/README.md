# AWS IoT TwinMaker Insights

## Summary

The module provides a sample integration with simulation functionality via Maplesoft, as well as a sample integration with a pretrained machine learning model for anomaly detection. 

It deploys 2 stacks:

* CookieFactorySageMakerStack - deploys two SageMaker endpoints, one as a sample simulation service for running MapleSoft simulation, the other as an inference endpoint using a pretrained anomaly detection model. Both endpoints accept HTTP POST requests. See a sample request in the "Test SageMaker Endpoints" section below. 
* CookieFactoryKdaStack - contains a KDA Studio notebook application configured with the AWS IoT TwinMaker connector library. In this notebook you can write Flink SQL streaming applications against AWS IoT TwinMaker data sources. The notebook application also interacts with the simulation/anomaly detection features hosted in SageMaker.

Please note that the KDA notebook may incur AWS charges so it's recommended to stop the instance when it is not needed.

## Prerequisites

* (optional) Install [awscurl](https://github.com/okigan/awscurl) to test simulation service or ML inference directly.

---

## Setup / Test

1. Set environment variables for convenience
  - change to the directory of this README
    ```
    cd [where this README is]
    ```
  - set directory for later instructions
    ```
    INSIGHT_DIR=$PWD
    ```
  - set stack names
    ```
    export KDA_STACK_NAME=CookieFactoryKdaStack
    export SAGEMAKER_STACK_NAME=CookieFactorySageMakerStack
    ```  
2. Deploy Insights-related stacks
  - change directory
    ```
    cd $INSIGHT_DIR/cdk
    ```
  - install cdk dependencies
    ```
    npm install
    ```
  - deploy stacks using cdk (answer `y` to accept IAM changes when prompted)
    ```
    cdk deploy --all
    ```
  - Note the SageMaker Endpoint Names that the cdk command will output once finished (output called `SageMakerEndpointNames`). The value will look similar to: `SimulationEndpoint-IkxImigGVK6i` for simulation, and `AnomalyDetectionEndpoint-ZS4j48mRF3zR` for anomaly detection.
3. (optional) Test SageMaker Endpoints
  - Test Simulation Service
    - set environment variables for convenience
      ```
      export SIMULATION_ENDPOINT_NAME=[fill in your endpoint name]
      export ENDPOINT_URL=https://runtime.sagemaker.us-east-1.amazonaws.com/endpoints/${SIMULATION_ENDPOINT_NAME}/invocations
      ```
    - send test request against Maplesoft simulation running in Sagemaker
      ```
      awscurl --service sagemaker -X POST -H "Content-Type: application/json" -d '{           
        "inputs": {
          "RPM": 50
        },
        "end_time": 1633396537
      }' $ENDPOINT_URL
      ```
      The response should be something like ```{"end_time": 163339673, "outputs": {"Power": 78.31207971087645}}```.

  - Test Anomaly Detection
    - set environment variables for convenience
      ```
      export AD_ENDPOINT_NAME=[fill in your endpoint name]
      export AD_ENDPOINT_URL=https://runtime.sagemaker.us-east-1.amazonaws.com/endpoints/${AD_ENDPOINT_NAME}/invocations
      ```
    - send test request against Maplesoft simulation running in Sagemaker
      ```
      awscurl --service sagemaker -X POST -H "Content-Type: application/json" -d '{"instances": [{"features": [58.00]}]}' $AD_ENDPOINT_URL
      ```
      The response should be something like ```{"scores":[{"score":1.019143498}]}```.    
4. Setup KDA Studio, SiteWise resources for insights
  - start and bootstrap KDA notebook (can take ~5 minutes for notebook startup)
    ```
    cd $INSIGHT_DIR
    ```
    ```
    python3 $INSIGHT_DIR/install_insights_module.py --workspace-id $WORKSPACE_ID --region-name $AWS_DEFAULT_REGION --import-all
    ```
  - Navigate to the link output by the above (may have a long pre-signed url token). Please note to copy the full length of link output.
  - Update the paragraphs in the maple as needed:
    - update the timestamp in the `CREATE TABLE` call if needed based on when your data was ingested
  - Execute all the paragraphs sequentially in the notebook to see simulation data streamed from AWS IoT TwinMaker into the Maplesoft simulation and results outputed to the notebook

## Set up AWS IoT TwinMaker Insight Dashboard
This section should be similar to setting up the main Cookie Factory dashboard described in [GettingStarted/README.md](../../../README.md). If you have aleady finished setting up the main Cookie Factory dashboard. You can skip step 1 below.
1.    AWS IoT TwinMaker provides a Grafana plugin that allows you to build dashboards using IoT TwinMaker scenes and modeled data sources. Grafana is deployable as a docker container. We recommend new users follow these instructions to setup Grafana as a local container: [Instructions](./docs/grafana_local_docker_setup.md) (if link does not work in Cloud9, open `docs/grafana_local_docker_setup.md`)
      
      For advanced users aiming to setup a production Grafana installation in their account, we recommend checking out https://github.com/aws-samples/aws-cdk-grafana
2. Import Grafana dashboards for the Cookie Factory

    Once you have the Grafana page open, you can click through the following to import the following sample dashboard json files in `$INSIGHT_DIR/sample_data/sample_dashboards`

    * aws_iot_twinmaker_insights_dashboard.json

## Cleanup

1. Go to CloudFormation console and delete the 2 stacks
2. Run scripts to delete sitewise components created for anomaly detection and simulation.
```
python3 $INSIGHT_DIR/install_insights_module.py --workspace-id $WORKSPACE_ID --region-name $AWS_DEFAULT_REGION --delete-all
```

---

## License

This project is licensed under the Apache-2.0 License.