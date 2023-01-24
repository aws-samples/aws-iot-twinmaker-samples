# AWS IoT TwinMaker Getting Started Sample Setup Instructions for AWS Cloud9

## Summary

AWS Cloud9 provides a cloud IDE that can be used to create an environment that comes pre-installed with typical cloud development tools. The AWS IoT TwinMaker Getting Started samples provide a sample working development environment for building Digital Twins in AWS. Many required dependencies (such as awscli, cdk, and docker) come pre-installed in AWS Cloud9.

Note: If you encounter any issues, try checking the Troubleshooting section at the end of this page

## Prerequisites

* An AWS account

---

## Setup / Test

### 1. Create AWS Cloud9 environment in AWS Console

- https://console.aws.amazon.com/cloud9/home
- "Create environment" (top-right)
- "Name environment" settings
    ```
    [Name] IoT TwinMaker Development
    ```
- "Next Step" > "Configure settings" setting (can leave as defaults)
    ```
    [Environment type] Create a new EC2 instance for environment (direct access)
    [Instance type] t2.large (8 GiB RAM + 2 vCPU)
    [Platform] Amazon Linux 2 (recommended)
    ```
- "Next Step" > "Create environment"
- Wait for environment to be created

### 2. Adjust EC2 settings

The instance provisioned by AWS Cloud9 will need to be modified to have a larger volume for our AWS IoT TwinMaker assets and updated Ingress rules to allow us to connect to Grafana

- Access EC2 page (from the AWS Cloud9 IDE page)
    - "Admin circle" button in the top-right (to the left of the "Share" button)
    - "Manage EC2 Instance"
    - click on the Instance id link to bring up the "Instance summary" page for your instance
- Attach Instance Role
    - "Actions" (top right) > "Security" > "Modify IAM role"
    - (if you haven't already created a role for IoT TwinMaker development) "Create new IAM role"
        - "Create Role" (top right) > "Select trust entity" > "Custom trust policy" > Enter the following JSON
            ```
            {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": [
                                "cloud9.amazonaws.com",
                                "ec2.amazonaws.com"
                            ]
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }
            ```
        - "Next: Permissions" > "Create Policy" > "JSON" (tab to right of "Visual editor") > Enter the following JSON
            ```
            {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ssmmessages:CreateControlChannel",
                            "ssmmessages:CreateDataChannel",
                            "ssmmessages:OpenControlChannel",
                            "ssmmessages:OpenDataChannel",
                            "ssm:UpdateInstanceInformation"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Action": [
                            "iottwinmaker:*",
                            "s3:*",
                            "iotsitewise:*",
                            "kinesisvideo:*",
                            "cloudformation:*",
                            "timestream:*"
                        ],
                        "Resource": [
                            "*"
                        ],
                        "Effect": "Allow"
                    }
                ]
            }
            ```
        - "Next: Tags" > "Next: Review"
        - "Review policy" page:
          ```
          [Name] iottwinmaker_development
          ```
        - "Create policy" (note this will put you back at the list of policies, where `iottwinmaker_development` will now exist in the list)
        - Back in the "Attach permissions policies" page (url will be something like: `https://console.aws.amazon.com/iam/home#/roles$new?step=permissions&commonUseCase=EC2%2BEC2&selectedUseCase=EC2`)
            - click on the **role** refresh button (NOT refresh the page. Right side, same line as "Create policy")
            - search for "iottwinmaker_development"
            - check box next to the `iottwinmaker_development` role
            - "Next: Tags" > "Next: Review"
            - "Review" page
                ```
                [Name] iottwinmaker_development_role
                ```
            - "Create role"
    - Back in the "Modify IAM role" page (url will be something like: `https://console.aws.amazon.com/ec2/home?region=us-east-1#ModifyIAMRole:instanceId=i-04d3024693f6edc9c`)
        - click on the **role** refresh button (NOT refresh the page. Right side, same line as "Create policy")
        - select "iottwinmaker_development_role" from the dropdown
        - "Save" (this will bring you back to the instances list page)
- Update EC2 Security Group Ingress Rules
    - click on the Instance id link to bring up the "Instance summary" page for your instance
    - "Security" tab (middle of page, to right of "Details")
    - click on the security group link under "Security details" > "Security groups" section
    - "Edit inbound rules" (right side)
        - "Add rule"
            ```
            [Type] HTTP
            [Source] My IP
            ```
        - "Save rules"
- Expand volume size
    - click back to the "Instance summary" page for your instance
    - "Storage" tab (middle of page, 3 to right of "Details")
    - click on the volume link under "Block devices" > "Volume ID" section
    - click on the volume ID link in the "Volumes" page
        - "Modify" (top right)
        - Change the Size to `20` GiB
        - "Modify" (this brings you back to the volumes list)
    - the volume you just opened should be in "modifying" state (in "Volume state" column)
    - Wait for the volume to go back to "In-use" and green
    - Restart EC2 instance
        - click back to the "Instance summary" page for your instance
        - "Instance state" (top-right) > "Reboot Instance"
- Return to the Cloud9 console, after rebooting the instance it should be attempting to connect again. Wait for it to reconnect to the rebooted instance (may take a few minutes)
    - once reconnected, feel free to click the red banner link at top of page to refresh the IDE to re-enable AWS Toolkit and Git panel

### 3. Install other dependencies

In the bash terminal in Cloud9 run the following

Install OpenCV and jq dependencies

```
sudo yum install mesa-libGL jq -y
```

Upgrade pip

```
sudo python3 -m pip install --upgrade pip
```

Upgrade AWS CLI (should output `aws-cli/1.22.94` or greater)

```
sudo pip3 install awscli --ignore-installed docutils --force-reinstall --upgrade && source ~/.bashrc && aws --version
```

### 4. (Optional) Verify credentials

In the bash terminal in Cloud9, try running the following to verify your environment has `awscli` and properly configured credentials (you should not see any errors)

```
aws sts get-caller-identity
```

### 5. Open Getting started README in Cloud9

Your Cloud9 environment is now setup and able to be used for the rest of the IoT TwinMaker Getting Started samples. git clone or upload the AWS IoT TwinMaker Getting started samples and open the README.md file inside it

You can use "Preview" (top of page, to left of "Run" button) > "Preview File README.md" to view a rendered version of the file.

Note: that images and links to other Instructions might not load properly in Cloud9.

## Cleanup

1. Delete your environment from Cloud9
2. You can also delete the `iottwinmaker_development` role and policy created as part of this guide

---

## Troubleshooting

### Unable to connect to EC2 instance through web browser

Try temporarily setting the Ingress rules for the security group to 0.0.0.0/0 (all IPs)

---

## License

This project is licensed under the Apache-2.0 License.