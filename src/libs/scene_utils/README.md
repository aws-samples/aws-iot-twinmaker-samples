# IoT TwinMaker Scene SDK

## Use

This package provides sample command line scripts that automate the creation of IoT TwinMaker scenes. Upload 3D assets and place them in a 3D scene connected to IoT data via augmented widgets (tag, motion indicator, etc.).

## Prerequisites

You will need an IoT TwinMaker workspace to run the sample scripts. Complete steps 1-3 of Deploying the Sample Cookie Factory Workspace [here](https://github.com/aws-samples/aws-iot-twinmaker-samples/blob/main/README.md).

## Install

Make sure you are running the script in the `scene_utils` folder:

```bash
cd $GETTING_STARTED_DIR/src/libs/scene_utils
npm install
```

Set the following environment variables before running any sample script:

```bash
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_SESSION_TOKEN
AWS_REGION
```

You need to set your AWS account credentials and the region of your workspace for the AWS SDK used in these scripts. Even if you configured the variable `AWS_DEFAULT_REGION` you still need to set `AWS_REGION` because it is a key variable used by all clients in the AWS SDK.

### Usage

Run the following command in the directory of the sample script to see its usage.

For example, to understand the usage of the Cookie Factory sample:

```bash
npx ts-node samples/cookie_factory_sample/sample.ts -h
```

# Samples:

## 1. COOKIE FACTORY `samples/cookie_factory_sample/`

Create a Cookie Factory example scene in your workspace.

Use the models in the `scenes` directory for the `--assetDirPath` input.

### Prerequisites

In order to run the Cookie Factory sample script you need to complete steps 4-6 to have entities and components with property data in your workspace.

### Example

```bash
npx ts-node samples/cookie_factory_sample/sample.ts --workspaceId [WORKSPACE_ID] --sceneId [SCENE_ID] --assetDirPath $GETTING_STARTED_DIR/src/workspaces/cookiefactory/scenes/
```

### Output

CookieFactory TwinMaker scene with Mixer nodes tied to data, Cookie Line nodes, and a WaterTank with a Motion Indicator widget.

You will need to finish the Getting Started sample [setup](https://github.com/aws-samples/aws-iot-twinmaker-samples/blob/main/README.md) for Mixers to be added with tags connected to data.

---

## 2. DELETE `src/delete_sample/`

Delete nodes in your scene or the entire scene file.

### Example

1. Delete all nodes in your scene

```bash
npx ts-node samples/delete_sample/sample.ts --workspaceId [WORKSPACE_ID] --sceneId [SCENE_ID]
```

2. Delete the scene in TwinMaker and S3

```bash
npx ts-node samples/delete_sample/sample.ts --workspaceId [WORKSPACE_ID] --sceneId [SCENE_ID] --deleteAll
```
