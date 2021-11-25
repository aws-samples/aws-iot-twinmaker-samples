# Timestream Telemetry

## Summary

This module provides a sample implementation of an Amazon Timestream connector for AWS IoT TwinMaker. It includes:

* a CDK stack that will create the Timestream database as Telemetry table
* an AWS Lambda Function that implements the AWS IoT TwinMaker UDQ Connector interface to retrieve data from Timestream 
* a sample component type that provides the UDQ capability to attached AWS IoT TwinMaker entities

## Prerequisites

* python3
* CDK

---

## Setup / Test

1. build + deploy the CDK stack
2. update the `component-types/timestream_component_type` with your Lambda ARN and create it in your AWS IoT TwinMaker workspace

## Cleanup

1. delete the Telemetry CloudFormation stack
2. remove hte Timestream component type from your AWS IoT TwinMaker workspace

---

## License

This project is licensed under the Apache-2.0 License.