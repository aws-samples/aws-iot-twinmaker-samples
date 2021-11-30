# Timestream Telemetry

## Summary

This module provides a sample implementation of an Amazon Timestream connector for AWS IoT TwinMaker. It includes the following.

* A CDK stack that creates the Timestream database as Telemetry table.
* An AWS Lambda function that implements the AWS IoT TwinMaker UDQ Connector interface to retrieve data from Timestream. 
* A sample component type that provides the UDQ capability to the attached AWS IoT TwinMaker entities.

## Prerequisites

* Python3
* CDK

---

## Setup / Test

1. Build and deploy the CDK stack.
2. Update the `component-types/timestream_component_type` with your Lambda ARN, and create it in your AWS IoT TwinMaker workspace.

## Cleanup

1. Delete the Telemetry CloudFormation stack.
2. Remove the Timestream component type from your AWS IoT TwinMaker workspace.

---

## License

This project is licensed under the Apache-2.0 License.