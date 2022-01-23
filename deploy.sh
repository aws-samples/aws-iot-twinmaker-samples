# Set arguments as environment variables
export CDK_DEFAULT_ACCOUNT=$(aws sts get-caller-identity --query "Account" --output text) 
export GETTING_STARTED_DIR=$PWD
export AWS_DEFAULT_REGION=us-east-1
export CDK_DEFAULT_REGION=$AWS_DEFAULT_REGION
export TIMESTREAM_TELEMETRY_STACK_NAME=CookieFactoryTelemetry
export WORKSPACE_ID=CookieFactory

# Print environment variables
echo "Using the following settings"
echo "CDK_DEFAULT_ACCOUNT: ${CDK_DEFAULT_ACCOUNT}"
echo "GETTING_STARTED_DIR: ${GETTING_STARTED_DIR}"
echo "AWS_DEFAULT_REGION: ${AWS_DEFAULT_REGION}"
echo "CDK_DEFAULT_REGION: ${CDK_DEFAULT_REGION}"
echo "TIMESTREAM_TELEMETRY_STACK_NAME: ${TIMESTREAM_TELEMETRY_STACK_NAME}"
echo "WORKSPACE_ID: ${WORKSPACE_ID}"

# run from same directory as this README
# Uncomment and use if your AWS CLI version is less than 1.22.17
#aws configure add-model --service-model file://iottwinmaker-2021-11-29.normal.json

# You will also need to bootstrap your account for CDK so that custom assets, such as sample Lambda functions, can be easily deployed. Use the following command.
cdk bootstrap aws://$CDK_DEFAULT_ACCOUNT/$CDK_DEFAULT_REGION

# Build Lambda layers for CDK
aws ecr-public get-login-password --region $CDK_DEFAULT_REGION | docker login --username AWS --password-stdin public.ecr.aws


# END ENVIRONMENT SETUP
# COOKIE FACTORY DEPLOYMENT STARTS HERE


# Enter Venv
source env/bin/activate

# Install Python Libraries
pip3 install -r $GETTING_STARTED_DIR/src/workspaces/cookiefactory/requirements.txt


# Create IoT TwinMaker Workspace
# Only do this one and record the name of the Role ARN that is created
# python3 $GETTING_STARTED_DIR/src/workspaces/cookiefacRtory/setup_cloud_resources/create_iottwinmaker_workspace_role.py --region $AWS_DEFAULT_REGION

# In the console, create an IoT TwinMaker Workspace using the Role ARN that was output when you ran the above command
# Use instructions in the README of this repo

# Run the following script to create a role for accessing the workspace in a Grafana dashboard
# Note the ARN of the role you create. You will use it when configuring a data source in Grafana.
python3 $GETTING_STARTED_DIR/src/modules/grafana/create_grafana_dashboard_role.py --workspace-id $WORKSPACE_ID --region $AWS_DEFAULT_REGION

# Stuck above. Getting an error with the cv2 library.
# Either try reinstalling cv2 OR try the instructions for TwinMaker, below

# It is recommended to create a new IAM policy called CookieFactorySceneViewerPolicy using this template and attach the policy to an IAM role CookieFactoryDashboardRole.
# Template is saved here as cookie_factory_role.json

# Afterwards, move onto step 4 of the instructions

