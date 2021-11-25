# S3 document connector

## Summary

This module provides a sample implementation of an Amazon S3 connector for AWS IoT TwinMaker. It includes:

* a CDK stack (IoTTwinMakerCookieFactoryS3) that will create an AWS Lambda Function that implements the AWS IoT TwinMaker UDQ Connector interface 
*   to retrieve data from s3 json file 
* a sample script to create a s3 document connector in AWS IoT TwinMaker
* a sample script to attach a IoT TwinMaker entity with above connector
* a sample json file for operation status on a sample IoT TwinMaker entity.

## Prerequisites

* python3
* CDK

* $PWD is getting_started/src/modules/s3
---

## Setup / Test

1. init current path

    ```
    export GETTING_STARTED_DIR=$PWD
    ```

2. build + deploy the CDK stack
    in cmd:
    ```
    cd cdk && cdk deploy && cd $PWD
    ```

    Safe the following output, we need the value of CdkStack.S3ReaderUDQLambdaArn as --attribute-property-value-reader-by-entity-arn
    in next step. 
    ```
    Outputs:
    CdkStack.S3ReaderUDQLambdaArn = arn:aws:lambda:us-east-1:{account}:function:IoTTwinMakerCookieFactoryS3-s3ReaderUDQ***-***
    ```

3. create the s3 document connector within the workspace 
    ```
    cd $PWD/deploy-utils && \
    python3 ./create_s3_document_connector.py \
        --workspace-id CookieFactory \
        --component-type-id com.example.s3connector.document \
        --attribute-property-value-reader-by-entity-arn {CdkStack.S3ReaderUDQLambdaArn}
    ```

4. attach an entity with s3 document connector
    here workspace-id = CookieFactory, entity-id = Mixer_0_cd81d9fd-3f74-437a-802b-9747ff240837
    use the same component-type-id specified in step 2, which is `com.example.s3connector.document`
    upload a simple json file $PWD/component-types/operation_status.json to s3 like `s3://workspace-cookiefactory/operation/operation_status.json`
    then run the following cmd:

    ```
    python3 ./patch_s3_document_content.py \
        --workspace-id CookieFactory \
        --entity-id Mixer_0_cd81d9fd-3f74-437a-802b-9747ff240837 \
        --component-type-id com.example.s3connector.document \
        --s3-url-json s3://workspace-cookiefactory/operation/operation_status.json
    ```

5. verify the value can be read from IoT TwinMaker:
    ```
    aws iottwinmaker get-property-value --cli-input-json file://get-property-value.json
    ```
    It should return operationStatus value specified in json file stored in above s3 url.


## Cleanup

1. delete s3 document connector from entity-id = Mixer_0_cd81d9fd-3f74-437a-802b-9747ff240837 in IoT TwinMaker console 
2. delete s3 document component from workspace-id = CookieFactor in IoT TwinMaker console 
3. delete the IoTTwinMakerCookieFactoryS3 CloudFormation stack
4. delete s3 file in above s3 url.

---

## License

This project is licensed under the Apache-2.0 License.