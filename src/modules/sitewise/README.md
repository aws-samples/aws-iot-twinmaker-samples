# Migrating SiteWise Models and Assets to IoT TwinMaker Components and Entities
## Summary
Wit the SiteWise module, you can export SiteWise assets and models to a JSON file that is stored in S3. This json file can then be imported into IoT TwinMaker so that the exported SiteWise models are imported as IoT TwinMaker components and SiteWise assets are exported as IoT TwinMaker entities. The SiteWise hierarchy is also assigned to the IoT TwinMaker entity hierarchy. This migration can be achieved either by manually executing the export and import scripts or by executing the step function that is created when you deploy this module as CDK.

![Architecture Flow](sitewise_workflow.jpg)

## Prerequisite
Check out the latest code from https://github.com/aws-samples/aws-iot-twinmaker-samples. Let's call this directory "IoTTwinMakerHome."

## Execute as stand-alone script
```
export IoTTwinMakerHome=<Directory where your checked out the code>
export PYTHONPATH=.:${IoTTwinMakerHome}/src/modules/sitewise/sync-connector-lambda:${IoTTwinMakerHome}/src/libs/connector_utils/python/:$PYTHONPATH # where IoTTwinMakerHome is the directory where you checked out the code.
```

### To export the sitewise models and assets from iot sitewise to S3
```
cd ${IoTTwinMakerHome}/src/modules/sitewise/sync-connector-lambda
python migration.py
-b  --bucket                  The bucket to exported sitewise artifacts to.
-p  --prefix                  The prefix under which assets and models will be exported to.
-w  --workspace-id            Workspace id that will be created.
-r  --iottwinmaker-role-arn   ARN of the role assumed by Iottwinmaker
-n  --entity-name-prefix      Prefix to namespace entities
```

## Execute as step function
### Deploy the module using CDK
Check out the latest code from https://github.com/aws-samples/aws-iot-twinmaker-samples.
Deploy with cdk from the sitewise module directory as shown in the following.
```
cd cdk && cdk synth && cdk bootstrap aws://unknown-account/us-east-1 && cdk deploy
```
Execute the step function with the following input.

```
{
    "bucket": "my-tmp-east",
    "entity_prefix": "my-namespace-",
    "prefix": "sitewise/exports",
    "workspace_id": "sitewise",
    "iottwinmaker_role_arn": "arn:aws:iam::00000000000:role/iot-tm-service-role"
}
```

where
```
    bucket                  The bucket containing exported sitewise models
    entity_prefix           Prefix to namespace entities
    prefix                  The prefix to store exported sitewise assets and models
    workspace_id            Workspace id that will be created
    iottwinmaker_role_arn   IAM role that has permissions to create a workspace
```

---

## License

This project is licensed under the Apache-2.0 License.
