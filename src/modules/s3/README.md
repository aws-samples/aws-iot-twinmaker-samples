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

* $PWD is getting_started/src/modules/s3
---

## Setup / Test

1. Init current path

    ```
    export GETTING_STARTED_DIR=$PWD
    ```

2. Build + deploy the CDK stack
    in cmd:
    ```
    cd cdk && cdk deploy && cd $PWD
    ```

    Save the following output, We need the value of CdkStack.S3ReaderUDQLambdaArn as --attribute-property-value-reader-by-entity-arn
    in next step. 
    ```
    Outputs:
    CdkStack.S3ReaderUDQLambdaArn = arn:aws:lambda:us-east-1:{account}:function:IoTTwinMakerCookieFactoryS3-s3ReaderUDQ***-***
    ```

3. Create the s3 document connector within the workspace.
    ```
    cd $PWD/deploy-utils && \
    python3 ./create_s3_document_connector.py \
        --workspace-id CookieFactory \
        --component-type-id com.example.s3connector.document \
        --attribute-property-value-reader-by-entity-arn {CdkStack.S3ReaderUDQLambdaArn}
    ```

4. Attach an entity with s3 document connector.
    Here workspace-id = CookieFactory, entity-id = Mixer_0_cd81d9fd-3f74-437a-802b-9747ff240837
    use the same component-type-id specified in step 2, which is `com.example.s3connector.document`
    upload a simple json file $PWD/component-types/operation_status.json to s3 like `s3://workspace-cookiefactory/operation/operation_status.json`
    then run the following cmd.

    ```
    python3 ./patch_s3_document_content.py \
        --workspace-id CookieFactory \
        --entity-id Mixer_0_cd81d9fd-3f74-437a-802b-9747ff240837 \
        --component-type-id com.example.s3connector.document \
        --s3-url-json s3://workspace-cookiefactory/operation/operation_status.json
    ```

5. verify that the value can be read from IoT TwinMaker:
    ```
    aws iottwinmaker get-property-value --cli-input-json file://get-property-value.json
    ```
    It should return operationStatus value specified in json file stored in above s3 url.


## Cleanup

1. Delete s3 document connector from entity-id = Mixer_0_cd81d9fd-3f74-437a-802b-9747ff240837 in the IoT TwinMaker console.
2. Delete s3 document component from workspace-id = CookieFactor in IoT TwinMaker console.
3. Delete the IoTTwinMakerCookieFactoryS3 CloudFormation stack.
4. Delete s3 file in the preceding S3 url.

---

## License

This project is licensed under the Apache-2.0 License.