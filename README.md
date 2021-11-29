# AWS IoT TwinMaker Getting Started

## Summary

This project will guide you through the process of building a digital twin application using AWS IoT TwinMaker. The project contains many samples including a simulated cookie factory that lets you explore many of the features of IoT TwinMaker. After going through this README you will have the below dashboard running in Grafana which you can use to interact with the sample CookieFactory digital twin.

![Grafana Import CookieFactory](docs/images/grafana_import_result_cookiefactory.png)

Note: These instructions have primarily been tested for Mac/Linux/WSL environments. For a standardized development environment, consider following our [Cloud9 setup guide](./CLOUD9_SETUP.md) then running these instructions in Cloud9

If you run into issues, please see the Troubleshooting section of this page.

## Prerequisites

1. This sample depends on AWS services that might not be availabe in all regions yet. Please run this sample in one of the following regions:
   - US East (N. Virginia) (us-east-1)
   - US West (Oregon) (us-west-2)
   - Europe (Ireland) (eu-west-1)
3. An AWS account for IoT TwinMaker + [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
   - It's recommended to [configure](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) your default credentials to match the account you want to setup this getting started in. Use the following command to verify you are using the right account. (should be pre-configured in Cloud9)
     ```bash
     aws sts get-caller-identity
     ```
   - Temporary prerequisite to install CLI models (won't be needed at preview)
     ```bash
     # run from same directory as this README
     aws configure add-model --service-model file://iottwinmaker-2021-11-29.normal.json
     ```
   - once setup, test your access with the following (you should not receive errors):
      `aws iottwinmaker list-workspaces --region us-east-1`
4. [Python3](https://www.python.org/downloads/)
   - verify your python3 path and version (3.7+). (should be pre-installed in Cloud9)
       - `python3 --version`
   - **Optional**: [Pyenv](https://github.com/pyenv/pyenv) and [Pyenv-virtualenv](https://github.com/pyenv/pyenv-virtualenv). Use `pyenv` and `pyenv-virtualenv` to ensure you have correct python dependencies. They are optional as long as you have a system-wide python3 installation, but highly recommended for avoiding conflicts between multiple python projects.
5. [Node.js & NPM](https://nodejs.org/en/) with node v14.18.1+ and npm version 6.14.15+ (should be pre-installed in Cloud9)
   - `node --version`
   - `npm --version`
6. [AWS CDK toolkit](https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html#getting_started_install) with version at least `1.121.0` (cdk should be pre-installed in Cloud9, but you may need to bootstrap your account)
   - `cdk --version`
   - You will also need to bootstrap your account for CDK so custom assets like sample Lambda functions can be easily deployed
     ```
     cdk bootstrap aws://[your 12 digit AWS account id]/[region]
     
     # example
     # cdk bootstrap aws://123456789012/us-east-1
     ```

7. [Docker](https://docs.docker.com/get-docker/) (version 20+, should be pre-installed in Cloud9) and authenticate docker for public ECR registries
   - `docker --version`
   - 
   - Note: this is needed to build lambda layers for CDK
     ```bash
     aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws
     ```

## Deploying the Sample Cookie Factory Workspace

1. Setup environment variables

   Set the following environment variables to make it easier to execute the remaining steps.

   ```bash
   # Change into the same directory as this README
   cd [directory_of_this_README]
   ```

   ```bash
   # Set your aws account id, you can use `aws sts get-caller-identity` to see the account id you're currently using
   export CDK_DEFAULT_ACCOUNT=[replace_with_your_aws_account_id]
   ```

   ```bash
   # Set some options for our install. If you want to use another workspace ID then change 'CookieFactory' to your preference
   export GETTING_STARTED_DIR=$PWD
   export AWS_DEFAULT_REGION=us-east-1
   export CDK_DEFAULT_REGION=$AWS_DEFAULT_REGION
   export TIMESTREAM_TELEMETRY_STACK_NAME=CookieFactoryTelemetry
   export WORKSPACE_ID=CookieFactory
   ```

2. Python Libraries

   We are going to be using python to help deploy our Cookie Factory sample data. Install the required Python libraries.

   ```bash
   pip3 install -r $GETTING_STARTED_DIR/src/workspaces/cookiefactory/requirements.txt
   ```

3. Create an IoT TwinMaker workspace

   Different Digital Twin applications make use of different resources. Run the following to create a role for our workspace that has the necessary permissions for this sample application. Note the role name in the output as it will be used in the next step.

   ```bash
   python3 $GETTING_STARTED_DIR/src/workspaces/cookiefactory/setup_cloud_resources/create_iottwinmaker_workspace_role.py --region $AWS_DEFAULT_REGION
   ```

   Now go to the console and create a workspace with the same name you used for WORKSPACE_ID above. You can have the console automatically create S3 buckets for you and when asked to provide a role to the workspace, use the role name generated by the above script (it should contain "IoTTwinMakerWorkspaceRole" in the name).

   us-east-1:  https://us-east-1.console.aws.amazon.com/iottwinmaker/home?region=us-east-1

   After you create the workspace in the Console, run this script to create a role for accessing the workspace on a Grafana dashboard. This uses scoped down permissions for ReadOnly access to IoT TwinMaker and other AWS services in Grafana. Note the ARN of the role created - you will use it when configuring a datasource in Grafana.

   Make sure your current AWS credentials are the same as the ones you will use in Grafana. If not, go to the IAM console after running this script and update the trust permissions for the IAM user you will be using.

   ```bash
   python3 $GETTING_STARTED_DIR/src/modules/grafana/create_grafana_dashboard_role.py --workspace-id $WORKSPACE_ID --region $AWS_DEFAULT_REGION
   ```

4. Deploy an Instance of the Timestream Telemetry module

   Timestream Telemetry is a sample telemetry store for IoT data. It utilizes a single AWS Timestream database and table, and a lambda for reading and writing. The later steps will fill this table with sample data for the Cookie Factory. The commands below will create the database and table, and deploy the lambda function found under /src/lib/timestream_telemetry.

   ```bash
   cd $GETTING_STARTED_DIR/src/modules/timestream_telemetry/cdk/
   ```
   
   Install dependencies for the module

   ```
   npm install
   ```

   Deploy the module (enter 'y' when promted to accept IAM changes)

   ```
   cdk deploy
   ```

5. Import the Cookie Factory content.

   ```bash
   cd $GETTING_STARTED_DIR/src/workspaces/cookiefactory/

   # import cookie factory data into your workspace
   python3 -m setup_content \
     --telemetry-stack-name $TIMESTREAM_TELEMETRY_STACK_NAME \
     --workspace-id $WORKSPACE_ID \
     --region-name $AWS_DEFAULT_REGION \
     --import-all
   ```

   If you want to reimport the sample content you will need to add flags to delete the old content (--delete-all or individual flags like --delete-telemetry --delete-entities).

   If you want to import just parts of the sample content you can use individual import flags instead of --import-all (like --import-telemetry --import-entities).

6. (Optional verify entities, scenes, and UDQ)Test data connectivity through UDQ (Unified Data Query).

   After importing all content, you can go to the IoT TwinMaker console to view your created entities and scenes.

     * https://us-east-1.console.aws.amazon.com/iottwinmaker/home?region=us-east-1

   AWS IoT TwinMaker provides features to connect to and query your data sources via its component model and Unified Data Query interface. In this getting started, we imported some data into Timestream and setup the component and support UDQ Lambda that enables us to query it. Use the following to test we're able to query for Alarm data using the `get-property-value-history` API

   ```
   aws iottwinmaker get-property-value-history \
      --region $AWS_DEFAULT_REGION \
      --cli-input-json '{"componentName": "AlarmComponent","endDateTime": "2022-11-01T00:00:00","entityId": "Mixer_2_06ac63c4-d68d-4723-891a-8e758f8456ef","orderByTime": "ASCENDING","selectedProperties": ["alarm_status"],"startDateTime": "2021-11-01T00:00:00","workspaceId": "'${WORKSPACE_ID}'"}'
   ```

7. Setup Grafana for the Cookie Factory

   AWS IoT TwinMaker provides a Grafana plugin that allows you to build dashboards using IoT TwinMaker scenes and modeled data sources. Grafana is deployable as a docker container. We recommend new users follow these instructions to setup Grafana as a local container: [Instructions](./docs/grafana_local_docker_setup.md) (if link does not work in Cloud9, open `docs/grafana_local_docker_setup.md`)
   
   For advanced users aiming to setup a production Grafana installation in their account, we recommend checking out https://github.com/aws-samples/aws-cdk-grafana

8. Import Grafana dashboards for the Cookie Factory

   Once you have the Grafana page open, you can click through the following to import the following sample dashboard json file in `$GETTING_STARTED_DIR/src/workspaces/cookiefactory/sample_dashboards/`

   * mixer_alarms_dashboard.json

   ![Grafana Import CookieFactory](docs/images/grafana_import_dashboard.png)

   For the CookieFactory sample running with local grafana, you can navigate to http://localhost:3000/d/y1FGfj57z/aws-iot-twinmaker-mixer-alarm-dashboard?orgId=1& to see the dashboard

## Deploying Additional (Add-on) Content

### SiteWise Connector

In this section we'll add SiteWise assets and telemetry, then update the CookieFactory digital twin entities to link to this data source.

1. Add SiteWise assets and telemetry

   ```
   python3 $GETTING_STARTED_DIR/src/modules/sitewise/deploy-utils/SiteWiseTelemetry.py import --csv-file $GETTING_STARTED_DIR/src/workspaces/cookiefactory/sample_data/telemetry/telemetry.csv \
   --entity-include-pattern WaterTank \
   --asset-model-name-prefix $WORKSPACE_ID
   ```

2. Update entities to attach SiteWise connector

   ```
   python3 $GETTING_STARTED_DIR/src/modules/sitewise/lib/patch_sitewise_content.py --workspace-id $WORKSPACE_ID --region $AWS_DEFAULT_REGION
   ```

3. Test SiteWise data connectivity with UDQ to query WaterTank volume metrics

   ```
   aws iottwinmaker get-property-value-history \
   --region $AWS_DEFAULT_REGION \
   --cli-input-json '{"componentName": "WaterTankVolume","endDateTime": "2022-11-01T00:00:00","entityId": "WaterTank_ab5e8bc0-5c8f-44d8-b0a9-bef9c8d2cfab","orderByTime": "ASCENDING","selectedProperties": ["tankVolume1"],"startDateTime": "2021-11-01T00:00:00","workspaceId": "'${WORKSPACE_ID}'"}'
   ```

4. Update a Grafana dashboard to use the new component data

   If you go to a WaterTank dashboard panel,

### S3 Document Connector

See s3 module [README](./src/modules/s3/README.md)

### AWS IoT TwinMaker Insight and Simulation

Go to the `insights` directory and check the README.

```
cd $GETTING_STARTED_DIR/src/modules/insights
```

---

## Teardown

```bash
# you should have following variables set:
# GETTING_STARTED_DIR=__see_above__
# WORKSPACE_ID=__see_above__
# TIMESTREAM_TELEMETRY_STACK_NAME=__see_above__
# AWS_DEFAULT_REGION=us-east-1

cd $GETTING_STARTED_DIR/src/workspaces/cookiefactory

python3 -m setup_content \
     --telemetry-stack-name $TIMESTREAM_TELEMETRY_STACK_NAME \
     --workspace-id $WORKSPACE_ID \
     --region-name $AWS_DEFAULT_REGION \
     --delete-all \
     --delete-workspace-role-and-bucket

# Note: this recursive flag has been temporarily added directly into the above script, you can just kill the script with ctrl-c and rerun if encounter stuck entities in deletion

# delete the CFN stack + wait
aws cloudformation delete-stack --stack-name $TIMESTREAM_TELEMETRY_STACK_NAME --region $AWS_DEFAULT_REGION && aws cloudformation wait stack-delete-complete --stack-name $TIMESTREAM_TELEMETRY_STACK_NAME --region $AWS_DEFAULT_REGION

# teardown SiteWise content
python3 $GETTING_STARTED_DIR/src/modules/sitewise/deploy-utils/SiteWiseTelemetry.py cleanup --asset-model-name-prefix $WORKSPACE_ID

# tear down grafana dashboard role
python3 $GETTING_STARTED_DIR/src/modules/grafana/cleanup_grafana_dashboard_role.py --workspace-id $WORKSPACE_ID --region $AWS_DEFAULT_REGION
```

Optionally, you can remove the local grafana configuration data

```
# alternatively delete it
mv ~/local_grafana_data/ /tmp/
```

---

## Troubleshooting

For any issue not addressed here, please open an issue or contact AWS Support.

### `Error parsing parameter '--service-model': Unable to load paramfile file://iottwinmaker-2021-11-29.normal.json: [Errno 2] No such file or directory: 'iottwinmaker-2021-11-29.normal.json'`

Verify you are running the command from the same directory as this README file.

---

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This project is licensed under the Apache-2.0 License.
