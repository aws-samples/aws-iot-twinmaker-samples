# S3 document connector

## Summary

This module provides a sample implementation of an Amazon S3 connector for AWS IoT TwinMaker. It includes the following.

* A CDK stack (IoTTwinMakerCookieFactoryS3) that creates an AWS Lambda Function that implements the AWS IoT TwinMaker UDQ Connector interface   to retrieve data from s3 json file 
* A sample script to create an S3 document connector in AWS IoT TwinMaker.
* A sample script to attach an IoT TwinMaker entity with preceding connector.
* A sample json file for operation status on a sample IoT TwinMaker entity.

## Prerequisites

* Python3
* CDK
* Your current working directory is the same as this README (e.g. `src/modules/s3`)
* `$WORKSPACE_ID` is set to the workspace to add this content to. This should already be set if you came here from the README at root of this project.
* [jq](https://stedolan.github.io/jq/)

---

## Setup / Test

1. Init current path
    
    If you came here from the base cookie factory README

    ```
    export S3_MODULE_DIR=$PWD
    ```

2. Build + deploy the CDK stack

    (Enter 'y' when promted to accept IAM changes.)

    ```
    cd cdk && npm install && cdk deploy
    ```

    Save the following output from the stack deployment. We need the value of CdkStack.S3ReaderUDQLambdaArn as --attribute-property-value-reader-by-entity-arn
    in next step. 
    
    ```
    export S3_CONNECTOR_STACK_OUTPUTS=$(aws cloudformation describe-stacks --stack-name IoTTwinMakerCookieFactoryS3 | jq '.Stacks[0].Outputs')
    export S3_CONNECTOR_UDQ_LAMBDA_ARN=$(echo $S3_CONNECTOR_STACK_OUTPUTS | jq -r '.[] | select(.OutputKey=="S3ReaderUDQLambdaArn").OutputValue')
    ```

3. Create the s3 document connector within the workspace.
    ```
    cd $S3_MODULE_DIR/deploy-utils && \
    python3 ./create_s3_document_connector.py \
        --workspace-id $WORKSPACE_ID \
        --component-type-id com.example.s3connector.document \
        --attribute-property-value-reader-by-entity-arn ${S3_CONNECTOR_UDQ_LAMBDA_ARN} \
        --region ${AWS_DEFAULT_REGION}
    ```

4. Create sample S3 status document

    ```
    WORKSPACE_S3=$(aws iottwinmaker get-workspace --workspace-id $WORKSPACE_ID | jq -r .s3Location | cut -d ":" -f 6) && \
        cat $S3_MODULE_DIR/component-types/operation_status.json | jq '.propertyValues[0].workspaceId = "'$WORKSPACE_ID'"' > /tmp/operation_status.json && \
        aws s3 cp /tmp/operation_status.json s3://${WORKSPACE_S3}/operation_status.json
    ```

5. Attach an entity with s3 document connector.

    Use the same component-type-id specified in step 2, which is `com.example.s3connector.document`
    upload a simple json file $PWD/component-types/operation_status.json to s3 like `s3://workspace-cookiefactory/operation/operation_status.json`
    then run the following cmd.

    ```
    python3 ./patch_s3_document_content.py \
        --workspace-id $WORKSPACE_ID \
        --entity-id Mixer_0_cd81d9fd-3f74-437a-802b-9747ff240837 \
        --component-type-id com.example.s3connector.document \
        --s3-url-json s3://${WORKSPACE_S3}/operation_status.json \
        --region ${AWS_DEFAULT_REGION}
    ```

6. verify that the value can be read from IoT TwinMaker:
    ```
    aws iottwinmaker get-property-value \
        --component-name S3Connector \
        --entity-id Mixer_0_cd81d9fd-3f74-437a-802b-9747ff240837 \
        --selected-properties operationStatus \
        --workspace-id $WORKSPACE_ID
    ```
    It should return operationStatus value of `maintaining demo` specified in json file we stored in S3


## Cleanup

1. Delete s3 document connector from entity-id = Mixer_0_cd81d9fd-3f74-437a-802b-9747ff240837 in the IoT TwinMaker console.
2. Delete s3 document component `com.example.s3connector.document` from the workspace
3. Delete the IoTTwinMakerCookieFactoryS3 CloudFormation stack.
4. Delete s3 file in the preceding S3 url.

---

## License

This project is licensed under the Apache-2.0 License.