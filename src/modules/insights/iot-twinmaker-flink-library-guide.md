
---

Currently, IoT TwinMaker Flink library only supports Flink version 1.13.

---

# Using the IoT TwinMaker Flink library

This topic walks you through the steps required to install and use the IoT TwinMaker Flink library. This library uses the Apache Flink framework to read from and write to data stores used in your IoT TwinMaker workspaces. 

This topic assumes that you have the following prerequisites.

**Prerequisites**

1. A fully populated with scenes and components. Use the built-in component types for data from AWS services (e.g., AWS IoT SiteWise). Create custom component types for data from third party sources\. For more information, see [Using and creating component types](https://docs.aws.amazon.com/iot-twinmaker/latest/guide/twinmaker-component-types.html) in IoT TwinMaker user guide.
2. An understanding of Studio notebooks with Kinesis Data Analytics for Apache Flink. These notebooks are powered by [Apache Zeppelin](https://zeppelin.apache.org) and use the [Apache Flink](https://flink.apache.org) framework. For more information, see [Using a Studio notebook with Kinesis Data Analytics for Apache Flink](https://docs.aws.amazon.com/kinesisanalytics/latest/java/how-notebook.html).

**Note**  
For instructions on setting up IoT TwinMaker flink library with the quick start in [AWS IoT TwinMaker samples](https://github.com/aws-samples/aws-iot-twinmaker-samples), see [README file for the sample insights application](./README.md).

## Overview

The following diagram illustrates how the IoT TwinMaker Flink library interacts with other frameworks and services to perform read and write operations on AWS and third-party data stores used in IoT TwinMaker workspaces.

![\[The IoT TwinMaker Flink library uses the data reader and data writer functions implemented by IoT TwinMaker components to read to and write from both AWS and third-party data stores.\]](./iot-twinmaker-flink-library-diagram.png)

You use the IoT TwinMaker Flink library by installing it as a custom connector in Kinesis Data Analytics and performing Flink SQL queries in a Zeppelin notebook in Kinesis Data Analytics. The library leverages IoT TwinMaker components to retrieve data from your workspace.

## Installing the library

The following steps describe how to install theIoT TwinMaker Flink library.

1. Create a Kinesis Data Analytics Studio notebook by following the instructions in [Creating a Studio notebook](https://docs.aws.amazon.com/kinesisanalytics/latest/java/how-zeppelin-creating.html).

2. Add a customer connector by following the instructions in [Dependencies and custom connectors](https://docs.aws.amazon.com/kinesisanalytics/latest/java/how-zeppelin-connectors.html#zeppelin-custom-connectors)\.

   The IoT TwinMaker Flink library (for Flink 1.13) can be downloaded from https://aws-iot-twinmaker-flink-downloads-us-east-1.s3.amazonaws.com/aws-iot-twinmaker-flink-1.13.1.jar  
   
   Enter the bucket value in the **Location of custom connector in S3** field, and the S3 object key in the **Path to S3 object** field. You can also upload the library and use your own S3 location. 

## Using the library

The examples in this section show how to create input and output tables for IoT TwinMaker streaming data by using Flink SQL\. For more information about Flink SQL, see [Flink SQL](https://nightlies.apache.org/flink/flink-docs-release-1.13/docs/dev/table/sql/overview/)\.

### Creating input tables

Input tables can specify only one property. The following example shows how to create an input table for one property in a single component in a single entity.

```
 %flink.ssql

CREATE TABLE input_table (
  `entity_id` STRING,
  `component_name` STRING,
  `actual property name` DOUBLE,
  `timestamp` TIMESTAMP(3),
  WATERMARK FOR `timestamp` AS `timestamp` - INTERVAL '2' SECOND
) WITH (
  'connector' = 'iot-twinmaker',
  'aws.region' = 'region',
  'iottwinmaker.workspace_id' = 'actual workspace Id',
  'iottwinmaker.entity_id' = 'actual entity name',
  'iottwinmaker.component_name' = 'actual component name',
  'iottwinmaker.property_name' = 'actual property name'
);
```

**Notes**:

The value of `connector` must be `iot-twinmaker`. The column names defined in the table must be `entity_id`, `component_name`, `timestamp` and the actual property name in the IoT TwinMaker entity. The value of `iottwinmaker.property_name` must exactly match the name of the property in the entity as well.

The following example shows how to create an input table for a single property in a single component type across entities. This example uses the built-in AWS IoT SiteWise component type.

```
%flink.ssql

CREATE TABLE input_table (
  `entity_id` STRING,
  `component_name` STRING,
  `actual property name` DOUBLE,
  `timestamp` TIMESTAMP(3),
  WATERMARK FOR `timestamp` AS `timestamp` - INTERVAL '2' SECOND
) WITH (
  'connector' = 'iot-twinmaker',
  'aws.region' = 'region',
  'iottwinmaker.workspace_id' = 'actual workspace name',
  'iottwinmaker.component_type_id' = 'com.amazon.iotsitewise.connector'
  'iottwinmaker.property_name' = 'actual property name'
);
```

The following example shows how to create an input table for a single property in all children of a parent entity. This example uses the built-in AWS IoT SiteWise component type.

```
 %flink.ssql

CREATE TABLE input_table (
  `entity_id` STRING,
  `component_name` STRING,
  `actual property name` DOUBLE,
  `timestamp` TIMESTAMP(3),
  WATERMARK FOR `timestamp` AS `timestamp` - INTERVAL '2' SECOND
) WITH (
  'connector' = 'iot-twinmaker',
  'aws.region' = 'us-east-1', 
  'iottwinmaker.workspace_id' = 'actual workspace name',
  'iottwinmaker.parent_entity_id' = 'actual parent entity id'
  'iottwinmaker.component_type_id' = 'com.amazon.iotsitewise.connector'
  'iottwinmaker.property_name' = 'actual property name'
);
```

**Reading initial position**

You can configure your table sources to start reading an IoT TwinMaker data stream from a specific position by using the `source.initpos` field. The following list describes the valid values for this field.
+ `LATEST`: Reads data starting from the current time.
+ `AT_TIMESTAMP`: Reads data starting from the specified timestamp.

  You specify the timestamp by using the `source.initpos.timestamp` field. The following list describes valid values for `e source.initpos.timestamp`. 
  + A non-negative integer representing the number of seconds that has elapsed since Unix epoch.
  + A default or user-defined timestamp format. You specify the timestamp format by using the `source.initpos.timestamp.format` field.

    The default timestamp format is ` yyyy-MM-dd'T'HH:mm:ssXXX`\.

The following table describes the valid fields for creating input tables with the IoT TwinMaker Flink library\.


| Option | Required | Default Value | Type | Description | 
| --- | --- | --- | --- | --- | 
| connector | Yes | None | String | The name of the connector\. For IoT TwinMaker use iot\-twinmaker\. | 
| aws\.region | Yes | None | String | The AWS region of your IoT TwinMaker workspace\. | 
| aws\.endpoint | Yes | Derived from the specified region\. | String | The IoT TwinMaker endpoint\. | 
| iottwinmaker\.workspace\_id | Yes | None | String | The name of the IoT TwinMaker workspace\. | 
| iottwinmaker\.property\_name | Yes | None | String | The name of the IoT TwinMaker property\. | 
| iottwinmaker\.entity\_id | No | None | String | The name of the IoT TwinMaker entity\. | 
| iottwinmaker\.component\_name | No | None | String | The name of the IoT TwinMaker component\. | 
| iottwinmaker\.component\_type | No | None | String | The name of the IoT TwinMaker component type\. | 
| iottwinmaker\.parent\_entity\_id | No | None | String | The name of the IoT TwinMaker parent entity\. | 
| source\.initpos | No | LATEST | String | The initial position from which to start reading data from the table\. Valid values are LATEST or AT\_TIMESTAMP\. | 
| source\.initpos\.timestamp | No | LATEST | String | The initial timestamp from which to start reading data from the table\. | 
| source\.initpos\.timestamp\.format | No | yyyy\-MM\-dd'T'HH:mm:ssXXX | String | The date format of the timestamp from which to start reading data from the table\. | 
| source\.poll\.intervalseconds | No | 5 | Integer | The time interval in seconds used when calling the IoT TwinMaker [GetPropertyValueHistory](https://docs.aws.amazon.com/iot-twinmaker/latest/apireference/API_GetPropertyValueHistory.html) API\. Valid values are from 1 second to 600 seconds\.  | 

### Creating output tables

The examples in this section show how to create and use output tables by using Flink SQL queries. Output tables can specify multiple properties.

The following example shows how to create an output table for two properties in a single entity.

```
%flink.ssql

CREATE TABLE output_table (
  `entity_id` STRING,
  `component_name` STRING,
  `actual output_property_name1` DOUBLE,
  `actual output_property_name2` DOUBLE
  `timestamp` TIMESTAMP(3)
) WITH (
  'connector' = 'iot-twinmaker',
  'aws.region' = 'region',
  'iottwinmaker.workspace_id' = 'actual workspace name'
);
```

The following example shows how to write to an output table\.

```
insert into output_table select entity_id, component_name, input1, input1 * 2, `timestamp` input_table
```

The following table describes the valid fields for creating output tables with the IoT TwinMaker Flink library\.


| Option | Required | Default Value | Type | Description | 
| --- | --- | --- | --- | --- | 
| connector | Yes | None | String | The name of the connector\. For IoT TwinMaker use iot\-twinmaker\. | 
| aws\.region | Yes | None | String | The AWS region of your IoT TwinMaker workspace\. | 
| aws\.endpoint | Yes | Derived from the specified region\. | String | The IoT TwinMaker endpoint\. | 
| iottwinmaker\.workspace\_id | Yes | None | String | The name of the IoT TwinMaker workspace\. | 

If you specify only a single output property and also specify the required fields for input tables, you can read from an output table. The following example shows how to create an output table from which you can read data.

```
CREATE TABLE output_table (
  `entity_id` STRING,
  `component_name` STRING,
  `actual output_property_name` DOUBLE,
  `timestamp` TIMESTAMP(3)
) WITH (
  'connector' = 'iot-twinmaker',
  'aws.region' = 'region',
  'iottwinmaker.workspace_id' = 'actual workspace name',
  'iottwinmaker.parent_entity_id' = 'actual parent entity id',
  'iottwinmaker.component_type_id' = 'com.amazon.iotsitewise.connector',
  'iottwinmaker.property_name' = 'actual output_property_name',
  'source.initpos' = 'AT_TIMESTAMP',
  'source.initpos.timestamp' = '2021-11-14T21:14:17-08:00'
);
```

The following example shows how to read data from a table.

```
%flink.ssql(type=update)
select * from output_table;
```

## Library Releases
| Version      | Flink Version |  Release Date | S3 URL |   Comment |
| ----------- | ----------- | ----------- | ----------- | ----------- |
| 1.13.1      | 1.13 | Apr 15, 2022 | https://aws-iot-twinmaker-flink-downloads-us-east-1.s3.amazonaws.com/aws-iot-twinmaker-flink-1.13.1.jar       |Recommended |
| 1.13.0   | 1.13 | Nov 29, 2021 | https://aws-iot-twinmaker-flink-downloads-us-east-1.s3.amazonaws.com/aws-iot-twinmaker-flink-1.13.0.jar         | |