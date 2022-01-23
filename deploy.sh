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
# aws configure add-model --service-model file://iottwinmaker-2021-11-29.normal.json

# You will also need to bootstrap your account for CDK so that custom assets, such as sample Lambda functions, can be easily deployed. Use the following command.
cdk bootstrap aws://$CDK_DEFAULT_ACCOUNT/$CDK_DEFAULT_REGION

# Build Lambda layers for CDK
aws ecr-public get-login-password --region $CDK_DEFAULT_REGION | docker login --username AWS --password-stdin public.ecr.aws


# END ENVIRONMENT SETUP
# COOKIE FACTORY DEPLOYMENT STARTS HERE


# Enter Venv
source env/bin/activate

# Install Python Libraries
# pip3 install scikit-build # to resolve an error during pip install

pip install --upgrade pip
pip install -r $GETTING_STARTED_DIR/src/workspaces/cookiefactory/requirements.txt
sudo apt install libgl1-mesa-glx # to address issue with OpenCV


# Create IoT TwinMaker Workspace
# Only do this one and record the name of the Role ARN that is created
# python3 $GETTING_STARTED_DIR/src/workspaces/cookiefacRtory/setup_cloud_resources/create_iottwinmaker_workspace_role.py --region $AWS_DEFAULT_REGION

# In the console, create an IoT TwinMaker Workspace using the Role ARN that was output when you ran the above command
# Use instructions in the README of this repo

# Got this message after creating IoT TwinMaker Workspace via the AWS console
# It is recommended to create a new IAM policy called CookieFactorySceneViewerPolicy using this template and attach the policy to an IAM role CookieFactoryDashboardRole.
# Template is saved here as cookie_factory_role.json

# Run the following script to create a role for accessing the workspace in a Grafana dashboard
# Note the ARN of the role you create. You will use it when configuring a data source in Grafana.

# uncomment the line below the first time to get the Role ARN for Grafana
# python3 $GETTING_STARTED_DIR/src/modules/grafana/create_grafana_dashboard_role.py --workspace-id $WORKSPACE_ID --region $AWS_DEFAULT_REGION


# It seems that the above can't be run in Amazon Linux. May be due to lack of support for OpenCV
# Also, have added a few extra steps in the pip install, see above

# Deploy an Instance of the Timestream Telemetry module.
# cd $GETTING_STARTED_DIR/src/modules/timestream_telemetry/cdk/
# npm install
# cdk deploy


# STUCK ABOVE; MAY BE BECUASE I RAN OUT OF DISK SPACE
# TRY MOVING TO ANOTHER UBUNTU MACHINE WITH MORE DISK SPACE
# Instrucions here: https://docs.aws.amazon.com/cloud9/latest/user-guide/move-environment.html






# cd $GETTING_STARTED_DIR/src/workspaces/cookiefactory/

# import cookie factory data into your workspace
# python3 -m setup_content \
#   --telemetry-stack-name $TIMESTREAM_TELEMETRY_STACK_NAME \
#   --workspace-id $WORKSPACE_ID \
#   --region-name $AWS_DEFAULT_REGION \
#   --import-all