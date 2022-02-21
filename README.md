Note: if you are just looking for sample IAM policies to use when creating an AWS IoT TwinMaker workspace, please see these sample [permission](./docs/sample_workspace_role_permission_policy.json) and [trust relationship](./docs/sample_workspace_role_trust_policy.json) policies. If you would like to create this role [using AWS CloudFormation](https://console.aws.amazon.com/cloudformation/home#/stacks/create/template), please use [this template](./docs/sample_workspace_role.yml) .

The role permission policy will only grant AWS IoT TwinMaker access to manage workspace resources in your S3 buckets. We recommend you scope down the bucket permissions to your specific S3 bucket once it is created. You will also need to update the role to grant further permissions for your use-case, such as invoking AWS IoT TwinMaker custom AWS Lambda connectors you've implemented or accessing video stream metadata in AWS IoT SiteWise and Amazon Kinesis Video Streams. For an end-to-end setup experience (including auto-generation of these roles with all necessary permissions for the sample use-case) we recommend following the getting started guide below.

# AWS IoT TwinMaker Getting Started

## Summary

This project walks you through the process of building a digital twin application using AWS IoT TwinMaker. The project contains many samples, including a simulated cookie factory that you can use to explore many of the features of IoT TwinMaker. After going through this README you will have the following dashboard running in Grafana, which you can use to interact with the sample CookieFactory digital twin.

![Grafana Import CookieFactory](docs/images/grafana_import_result_cookiefactory.png)

Note: These instructions have primarily been tested for Mac/Linux/WSL environments. For a standardized development environment, consider following our [Cloud9 setup guide](./CLOUD9_SETUP.md) and then running these instructions in Cloud9

If you run into any issues, please see the Troubleshooting section of this page.

## Prerequisites

1. This sample depends on AWS services that might not yet be available in all regions. Please run this sample in one of the following regions:
   - US East (N. Virginia) (us-east-1)
   - US West (Oregon) (us-west-2)
   - Europe (Ireland) (eu-west-1)
2. An AWS account for IoT TwinMaker + [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
   - We recommend that you [configure](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) your default credentials to match the account in which you want to set up this getting started example. Use the following command to verify that you are using the correct account. (This should be pre-configured in Cloud9.)
     ```bash
     aws sts get-caller-identity
     ```
   - Ensure your AWS CLI version is at least 1.22.17.
     ```bash
     aws --version
     ```
     - Otherwise, you may use the following to directly install the `iottwinmaker` module to your current AWS CLI.
       ```bash
       # run from same directory as this README
       aws configure add-model --service-model file://iottwinmaker-2021-11-29.normal.json
       ```
   - When you are set up, test your access with the following command. (You should not receive errors.)
     ```
      aws iottwinmaker list-workspaces --region us-east-1
     ```      
3. [Python3](https://www.python.org/downloads/)
   - Verify your python3 path and version (3.7+). (This should be pre-installed in Cloud9.)
     ```
     python3 --version
     ```       
   - **Optional**: [Pyenv](https://github.com/pyenv/pyenv) and [Pyenv-virtualenv](https://github.com/pyenv/pyenv-virtualenv). Use `pyenv` and `pyenv-virtualenv` to ensure that you have correct Python dependencies. They are optional as long as you have a system-wide Python3 installation, but highly recommended for avoiding conflicts between multiple python projects.
4. [Node.js & NPM](https://nodejs.org/en/) with node v14.18.1+ and npm version 6.14.15+. (This should be pre-installed in Cloud9.) Use the following commands to verify.
     ```
     node --version
     ```

     ```
     npm --version
     ```
5. [AWS CDK toolkit](https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html#getting_started_install) with version at least `1.121.0`. (The CDK should be pre-installed in Cloud9, but you may need to bootstrap your account.) Use the following command to verify.
     ```
     cdk --version
     ```
   - You will also need to bootstrap your account for CDK so that custom assets, such as sample Lambda functions, can be easily deployed. Use the following command.
     ```
     cdk bootstrap aws://[your 12 digit AWS account id]/[region]
     
     # example
     # cdk bootstrap aws://123456789012/us-east-1
     ```

6. [Docker](https://docs.docker.com/get-docker/) version 20+. (This should be pre-installed in Cloud9.) Authenticate Docker for public ECR registries
     ```
     docker --version
     ```
   - Use the following command to build Lambda layers for CDK.
     ```bash
     aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws
     ```

## Deploying the Sample Cookie Factory Workspace

1. Set up environment variables.

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

2. Install Python Libraries.

   We use Python to help deploy our Cookie Factory sample data. Use the following command to install the required Python libraries.

   ```bash
   pip3 install -r $GETTING_STARTED_DIR/src/workspaces/cookiefactory/requirements.txt
   ```

3. Create an IoT TwinMaker workspace.

   Different Digital Twin applications use different resources. Run the following command to create a role for our workspace that has the necessary permissions for this sample application. Note that you will use the role name in the output in the next step.

   ```bash
   python3 $GETTING_STARTED_DIR/src/workspaces/cookiefactory/setup_cloud_resources/create_iottwinmaker_workspace_role.py --region $AWS_DEFAULT_REGION
   ```

   Now go to the console and create a workspace with the same name that you used for WORKSPACE_ID in the previous step. You can have the console automatically create S3 buckets for you. When asked to provide a role for the workspace, use the role name generated by the preceding script. (The name should contain the string "IoTTwinMakerWorkspaceRole".)

   us-east-1:  https://us-east-1.console.aws.amazon.com/iottwinmaker/home?region=us-east-1

   After you create the workspace in the console, run the following script to create a role for accessing the workspace in a Grafana dashboard. This uses scoped-down permissions for ReadOnly access to IoT TwinMaker and other AWS services in Grafana. Note the ARN of the role you create. You will use it when configuring a data source in Grafana.

   Make sure that your current AWS credentials are the same as the ones you use in Grafana. If not, go to the IAM console after running this script and update the trust permissions for the IAM user you will be using.

   ```bash
   python3 $GETTING_STARTED_DIR/src/modules/grafana/create_grafana_dashboard_role.py --workspace-id $WORKSPACE_ID --region $AWS_DEFAULT_REGION
   ```

4. Deploy an Instance of the Timestream Telemetry module.

   Timestream Telemetry is a sample telemetry store for IoT data. It uses a single AWS Timestream database and table, and a Lambda function for reading and writing. Later steps will fill this table with sample data for the Cookie Factory. The following commands create the database and table and deploy the lambda function found under /src/lib/timestream_telemetry.

   ```bash
   cd $GETTING_STARTED_DIR/src/modules/timestream_telemetry/cdk/
   ```
   
   Use the following command to install dependencies for the module

   ```
   npm install
   ```

   Deploy the module. (Enter 'y' when prompted to accept IAM changes.)

   ```
   cdk deploy
   ```

5. Use the following commands to import the Cookie Factory content.

   ```bash
   cd $GETTING_STARTED_DIR/src/workspaces/cookiefactory/

   # import cookie factory data into your workspace
   python3 -m setup_content \
     --telemetry-stack-name $TIMESTREAM_TELEMETRY_STACK_NAME \
     --workspace-id $WORKSPACE_ID \
     --region-name $AWS_DEFAULT_REGION \
     --import-all
   ```

   If you want to reimport the sample content you need to add flags to delete the old content (such as --delete-all or individual flags such as --delete-telemetry and  --delete-entities).

   If you want to import only parts of the sample content, you can use individual import flags instead of --import-all (such as --import-telemetry and --import-entities).

6. (Optional) Verify connectivity for entities, scenes, and Unified Data Query (UDQ) Test data by using UDQ.

   After importing all content, you can go to the IoT TwinMaker console to view the entities and scenes that you created.

     * https://us-east-1.console.aws.amazon.com/iottwinmaker/home?region=us-east-1

   AWS IoT TwinMaker provides features to connect to and query your data sources via its component model and Unified Data Query interface. In this getting started, we imported some data into Timestream and set up the component and support UDQ Lambda function that enables us to query it. Use the following command to test whether we're able to query for alarm data by using the `get-property-value-history` API.

   ```
   aws iottwinmaker get-property-value-history \
      --region $AWS_DEFAULT_REGION \
      --cli-input-json '{"componentName": "AlarmComponent","endDateTime": "2022-11-01T00:00:00","entityId": "Mixer_2_06ac63c4-d68d-4723-891a-8e758f8456ef","orderByTime": "ASCENDING","selectedProperties": ["alarm_status"],"startDateTime": "2021-11-01T00:00:00","workspaceId": "'${WORKSPACE_ID}'"}'
   ```

7. Set up Grafana for the Cookie Factory.

   AWS IoT TwinMaker provides a Grafana plugin that you can use to build dashboards using IoT TwinMaker scenes and modeled data sources. Grafana is deployable as a docker container. We recommend that new users follow these instructions to set up Grafana as a local container: [Instructions](./docs/grafana_local_docker_setup.md). (If the link doesn't work in Cloud9, open `docs/grafana_local_docker_setup.md`.)
   
   For advanced users aiming to set up a production Grafana installation in their account, we recommend checking out https://github.com/aws-samples/aws-cdk-grafana.

8. Import Grafana dashboards for the Cookie Factory.

   When you have the Grafana page open, you can click through the following to import the sample dashboard json file in `$GETTING_STARTED_DIR/src/workspaces/cookiefactory/sample_dashboards/`. (If you are running from Cloud9, you can right-click and download the file locally then import it from your local machine)

   * mixer_alarms_dashboard.json

   ![Grafana Import CookieFactory](docs/images/grafana_import_dashboard.png)

   For the CookieFactory sample running with local Grafana, you can navigate to http://localhost:3000/d/y1FGfj57z/aws-iot-twinmaker-mixer-alarm-dashboard?orgId=1& to see the dashboard.

# Launching Grafana Instance

1. Launch EC2 Instance with Linux AMI and SSH enabled

2. Add inbound rules to security group of EC2 instance
   - Locate the security group of your instance
   - Click edit inbound rules and add 3 rules detailed below
      - Type: Custom TCP, Port range: 3000, Source: Custom 0.0.0.0/0
      - Type: HTTP, Port range: 80, Source: Custom 0.0.0.0/0
      - Type: HTTPS, Port range: 443, Source: Custom 0.0.0.0/0

3. Copy `grafana.ini` into instance using SSH or clone git repo

   `sudo scp -i path/to/your/key.pem aws-iot-twinmaker-samples/launch_grafana.sh ec2-user@your-instance-dns:~`

4. Copy `launch_grafana.sh` into instance using SSH or clone git repo

   `sudo scp -i path/to/your/key.pem aws-iot-twinmaker-samples/launch_grafana.sh ec2-user@your-instance-dns:~`

5. SSH into instance 

   `sudo ssh -i "path/to/your/key.pem" ec2-user@your-instance-dns`

6. Run `bash launch_grafana.sh`

7. You can now access the Grafana instance on port 3000 of your EC2 instance's Public IPv4 address

## Deploying Additional (Add-on) Content

### SiteWise Connector

In this section we'll add SiteWise assets and telemetry, and then update the CookieFactory digital twin entities to link to this data source.

1. Add SiteWise assets and telemetry.

   ```
   python3 $GETTING_STARTED_DIR/src/modules/sitewise/deploy-utils/SiteWiseTelemetry.py import --csv-file $GETTING_STARTED_DIR/src/workspaces/cookiefactory/sample_data/telemetry/telemetry.csv \
     --entity-include-pattern WaterTank \
     --asset-model-name-prefix $WORKSPACE_ID
   ```

2. Update entities to attach SiteWise connector.

   ```
   python3 $GETTING_STARTED_DIR/src/modules/sitewise/lib/patch_sitewise_content.py --workspace-id $WORKSPACE_ID --region $AWS_DEFAULT_REGION
   ```

3. Test SiteWise data connectivity with UDQ to query WaterTank volume metrics.

   ```
   aws iottwinmaker get-property-value-history \
     --region $AWS_DEFAULT_REGION \
     --cli-input-json '{"componentName": "WaterTankVolume","endDateTime": "2022-11-01T00:00:00","entityId": "WaterTank_ab5e8bc0-5c8f-44d8-b0a9-bef9c8d2cfab","orderByTime": "ASCENDING","selectedProperties": ["tankVolume1"],"startDateTime": "2021-11-01T00:00:00","workspaceId": "'${WORKSPACE_ID}'"}'
   ```

### S3 Document Connector

Go to the `s3` modules directory and check the [README](./src/modules/s3/README.md).

```
cd $GETTING_STARTED_DIR/src/modules/s3
```

### AWS IoT TwinMaker Insights and Simulation

Go to the `insights` modules directory and check the [README](./src/modules/insights/README.md).

```
cd $GETTING_STARTED_DIR/src/modules/insights
```

---

## Teardown

**Note that these are destructive actions and will remove all content you have created/modified from this sample.**

You should have the following environment variables set from the previous Setup instructions.

```bash
GETTING_STARTED_DIR=__see_above__
WORKSPACE_ID=__see_above__
TIMESTREAM_TELEMETRY_STACK_NAME=__see_above__
AWS_DEFAULT_REGION=us-east-1
```

Change directory

```
cd $GETTING_STARTED_DIR/src/workspaces/cookiefactory
```

Delete grafana dashboard role (if exists)

```
python3 $GETTING_STARTED_DIR/src/modules/grafana/cleanup_grafana_dashboard_role.py --workspace-id $WORKSPACE_ID --region $AWS_DEFAULT_REGION
```

Delete AWS IoT TwinMaker workspace + contents

```
# this script is safe to terminate and restart if entities seem stuck in deletion
python3 -m setup_content \
     --telemetry-stack-name $TIMESTREAM_TELEMETRY_STACK_NAME \
     --workspace-id $WORKSPACE_ID \
     --region-name $AWS_DEFAULT_REGION \
     --delete-all \
     --delete-workspace-role-and-bucket
```

Delete the Telemetry CFN stack + wait

```
aws cloudformation delete-stack --stack-name $TIMESTREAM_TELEMETRY_STACK_NAME --region $AWS_DEFAULT_REGION && aws cloudformation wait stack-delete-complete --stack-name $TIMESTREAM_TELEMETRY_STACK_NAME --region $AWS_DEFAULT_REGION
```

### Add-on Teardown: SiteWise Connector

Run the following if you installed the add-on SiteWise content and would like to remove it

```
python3 $GETTING_STARTED_DIR/src/modules/sitewise/deploy-utils/SiteWiseTelemetry.py cleanup --asset-model-name-prefix $WORKSPACE_ID
```

### Add-on Teardown: S3 Document Connector

Run the following if you installed the add-on SiteWise content and would like to remove it

```
aws cloudformation delete-stack --stack-name IoTTwinMakerCookieFactoryS3 --region $AWS_DEFAULT_REGION && aws cloudformation wait stack-delete-complete --stack-name IoTTwinMakerCookieFactoryS3 --region $AWS_DEFAULT_REGION
```

### Add-on Teardown: AWS IoT TwinMaker Insights and Simulation

Run the following if you installed the add-on AWS IoT TwinMaker Insights and Simulation content and would like to remove it. These stacks may take several minutes to delete.

Delete installed assets

```
python3 $INSIGHT_DIR/install_insights_module.py --workspace-id $WORKSPACE_ID --region-name $AWS_DEFAULT_REGION --kda-stack-name $KDA_STACK_NAME --sagemaker-stack-name $SAGEMAKER_STACK_NAME --delete-all
```

Delete cloudformation stacks

```
aws cloudformation delete-stack --stack-name $KDA_STACK_NAME --region $AWS_DEFAULT_REGION && aws cloudformation wait stack-delete-complete --stack-name $KDA_STACK_NAME --region $AWS_DEFAULT_REGION
```

```
aws cloudformation delete-stack --stack-name $SAGEMAKER_STACK_NAME --region $AWS_DEFAULT_REGION && aws cloudformation wait stack-delete-complete --stack-name $SAGEMAKER_STACK_NAME --region $AWS_DEFAULT_REGION
```

### (Optional) Delete local Grafana configuration

```
rm -rf ~/local_grafana_data/
```

---

## Troubleshooting

For any issue not addressed here, please open an issue or contact AWS Support.

### `Error parsing parameter '--service-model': Unable to load paramfile file://iottwinmaker-2021-11-29.normal.json: [Errno 2] No such file or directory: 'iottwinmaker-2021-11-29.normal.json'`

Verify that you're running the command from the same directory as this README file.

### Additional Troubleshooting added by Guidheouse Team
#### Problem-Solution 1: HTTP for TLS Encryption
Problem:
- Discover requires all external links to be HTTPS for TLS encryption

Solution:
- Setup application load balancer
    - Setup HTTP(S) Load Balancer
    - redirect port 80 to port 443
    - forward port 443 to public IP and port on which Grafana is running by registering on a target group
- Set up HTTPS
    - purchase domain
    - use aws certificate manager to assign certificate for subdomain '*' of the purchase domain
    - attached certificate to load balancer
    - Setup the following record on the purchased domain
        ```
        TYPE: CNAME
        Host name: <subdomain>.<purchased domain>
        Data: <DNS Name of HTTPS load balancer>
        ```
- https://support.smartbear.com/swaggerhub/docs/enterprise/installation/aws/https.html

#### Problem-Solution 2: X-frame-options DENY
Error:
- X-frame-options: DENY
- Set by Grafana to Deny as Default

Solution:
- following https://grafana.com/docs/grafana/latest/administration/configuration/
- changing in etc/grafana/grafana.ini 
	- approx line 241 under security
	- set `allow_embedding = true`
- restart container: `docker restart <container name>`

---

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This project is licensed under the Apache-2.0 License.
