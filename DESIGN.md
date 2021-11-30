# Samples Design

## Summary

This document provides an overview of the src package structure in this repository.

In particular, the src directory contains three main subdirectories

```
-- src
   |-- assets
   |-- lib
   |-- modules
   |-- workspaces
```

## assets

The `assets` directory contains static files for samples content.

## lib

The `lib` directory contains library functionality to facilitate sample development. For example, it contains `deploy_utils` a collection of helper python modules for creating samples infrastructure and ingesting mock data. `udq_helper_utils` contains python utility modules for developing AWS IoT TwinMaker UDQ connectors.

These libraries may also serve as a reference implementation for interacting with the AWS IoT TwinMaker service APIs.

## modules

The `modules` directory contains self-contained infrastructure and setup components that can be installed into an account and reused for different samples. For example, the `timestream_telemetry` module contains a CDK stack that will create an Amazon Timestream database and AWS IoT TwinMaker UDQ Lambda implementation for connecting to and querying data from the Timestream tables.

Modules should contain a README with more detailed information on the included capabilities as well as guidance on how to setup and cleanup the content for an AWS account. They should also be designed so that multiple instances are deployable to the same account (e.g. by accepting parameters to customize account/region-unique resource identifiers such as stack names).

These modules may also serve as a reference implementation for building connectors and other integrations with AWS IoT TwinMaker.

## workspaces

The `workspaces` directory contains end-to-end AWS IoT TwinMaker samples whose README instructions will stand up a fully-working Digital Twin in an AWS IoT TwinMaker workspace. Typically, these will include: steps to deploy capabilities from `modules`, install scripts to bootstrap data sources and pre-configure AWS IoT TwinMaker elements (such as entities, components, and scenes), as well as sample Grafana dashboards that provide an operator view of the Digital Twin.

Workspace samples should also be designed so that multiple instances are deployable to the same account (e.g. by accepting parameters to customize account/region-unique resource identifiers such as stack names).

These samples are intended to provide a working system that a developer can use to explore AWS IoT TwinMaker features or freely customize to experiment and tweak the system to better match their specific use-case. Samples should also provide instructions for cleaning up the end-to-end sample.

---

## License

This project is licensed under the Apache-2.0 License.
