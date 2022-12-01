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

## 2. CESIUM `samples/cesium_sample/`

Automates the Cesium Ion pipeline to export directly to IoT TwinMaker.

1. Upload your 3D asset to Cesium and wait for it to perform a tiling optimization.
2. Export the tileset directly to your workspace's S3 bucket.
3. Create/edit a TwinMaker scene with the 3D tileset

### Prerequisites

1. Register Cesium and choose the appropriate [subscription plan](https://cesium.com/platform/cesium-ion/pricing/) based on your business requirement
2. Create a Cesium asset token

   a. Go to the [tokens page](https://cesium.com/ion/tokens)

   b. Click “Create token”

   c. Name it “TwinMaker token”

   d. Toggle on the following permission scopes: 1. assets:list 2. assets:read 3. assets:write 4. exports:read 5. exports:write

   e. Click “Create”

   f. Copy and use this asset token for the `--cesiumAccessToken` parameter in the commands below

### Example

1. Upload a 3D asset to Cesium

```bash
npx ts-node samples/cesium_sample/sample.ts --workspaceId [WORKSPACE_ID] --sceneId [SCENE_ID] --assetFilePath [3D_ASSET_PATH] --cesiumAccessToken [ACCESS_TOKEN] --dracoCompression
```

The script will wait up to 5 minutes for Cesium to process the asset's tiles. When an asset is uploaded to Cesium it is assigned a random assetId. If it takes more than 5 minutes to tile the asset then run the next command below with its assetId to export its 3D tileset to your workspace's S3 bucket.

It is recommended to use the optional `--dracoCompression` parameter to enable compression on your asset during tiling. Read more about the benefits of Draco for rendering your 3D model [here](https://cesium.com/blog/2018/04/09/draco-compression/).

2. Export a Cesium tileset into a TwinMaker scene

Find the assetId of your asset on the "My Assets" tab of your [Cesium account](https://cesium.com/ion/assets).

```bash
npx ts-node samples/cesium_sample/sample.ts --workspaceId [WORKSPACE_ID] --sceneId [SCENE_ID] --cesiumAccessToken [ACCESS_TOKEN] --cesiumAssetId [ASSET_ID]
```

### Output

TwinMaker scene with a node for the Cesium tileset of your 3D asset.

### Supported file formats

You can upload any of the following file types to Cesium Ion through the sample script:

- GLTF, GLB, OBJ, FBX, DAE (3D Model), or LAS, LAZ (Point Cloud)

---

## 3. DELETE `src/delete_sample/`

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
