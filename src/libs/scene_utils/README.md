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

Have AWS credentials available in your environment before running any sample script. You can set the following environment variables:

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

CookieFactory IoT TwinMaker scene with Mixer nodes tied to data, Cookie Line nodes, and a WaterTank with a Motion Indicator widget.

You will need to finish the Getting Started sample [setup](https://github.com/aws-samples/aws-iot-twinmaker-samples/blob/main/README.md) for Mixers to be added with tags connected to data.

---

## 2. DELETE `src/delete_sample/`

Delete nodes in your scene or the entire scene file.

### Example

1. Delete all nodes in your scene

```bash
npx ts-node samples/delete_sample/sample.ts --workspaceId [WORKSPACE_ID] --sceneId [SCENE_ID]
```

2. Delete the scene in IoT TwinMaker and S3

```bash
npx ts-node samples/delete_sample/sample.ts --workspaceId [WORKSPACE_ID] --sceneId [SCENE_ID] --deleteAll
```

---

## 3. CESIUM `samples/cesium_sample/sample.ts`

Automates the Cesium Ion pipeline to convert 3D assets to 3D Tiles and upload directly to IoT TwinMaker.

1. Upload your 3D asset to Cesium and wait for it to perform the conversion to a 3D Tiles tileset.
2. Create an archive for the tileset to prepare for download.
3. Download archive for tileset.
4. Upload tileset to your IoT TwinMaker workspace S3 bucket.
5. Create/edit an IoT TwinMaker scene with the 3D tileset.

NOTE: This script is not recommended for a production environment. Cesium Ion is a 3rd party service not affiliated with AWS. By using this sample script you are accepting the risk of using Cesium Ion to store your assets. We recommend reviewing terms and conditions that apply to this script on the website of Cesium Ion at https://cesium.com.

### Prerequisites

1. Register Cesium and choose the appropriate [subscription plan](https://cesium.com/platform/cesium-ion/pricing/) based on your business requirement
2. Create a Cesium asset token

   a. Go to the [tokens page](https://cesium.com/ion/tokens)

   b. Click “Create token”

   c. Name it “TwinMaker token”

   d. Toggle on the following permission scopes: 
    * assets:list
    * assets:read
    * assets:write
    * archives:read
    * archives:write

These permissions allow the sample script to call Cesium `asset` and `archive` APIs to: upload your asset, track its conversion to 3D Tiles, create an archive for download, and then download the archive.

   e. Click “Create”

   f. Set the environment variable CESIUM_ACCESS_TOKEN with this token

### Example

This script runs up to 5 steps to convert your 3D asset into 3D Tiles for use in an IoT TwinMaker scene. When you start on any example below, the script will continue with all 5 steps. For example, if you have an asset already uploaded to Cesium Ion, start on step 2 to archive, download, and add the tileset to your scene.

1. Upload a 3D asset to Cesium

```bash
npx ts-node samples/cesium_sample/sample.ts --workspaceId [WORKSPACE_ID] --sceneId [SCENE_ID] --assetFilePath [3D_ASSET_PATH] --dracoCompression
```

The script will wait up to 5 minutes for Cesium to convert the asset to 3D Tiles and assign it a unique assetId. If it takes more than 5 minutes to tile the asset then run the command below with its assetId to continue downloading the tileset to your workspace's S3 bucket.

It is recommended to use the optional `--dracoCompression` parameter to enable compression on your asset during tiling. Read more about the benefits of Draco for rendering your 3D model [here](https://cesium.com/blog/2018/04/09/draco-compression/).

2. Create an archive for the tileset

Find the assetId of your asset on the "My Assets" tab of your [Cesium account](https://cesium.com/ion/assets).

```bash
npx ts-node samples/cesium_sample/sample.ts --workspaceId [WORKSPACE_ID] --sceneId [SCENE_ID] --cesiumAssetId [ASSET_ID]
```

This will output the archiveId for your asset's tileset. The script will continue to download the archive in the next step.

3. Download the archive for the tileset

Use the assetId and archiveId from the previous step to run the following command:

```bash
npx ts-node samples/cesium_sample/sample.ts [WORKSPACE_ID] --sceneId [SCENE_ID] --cesiumAssetId [ASSET_ID] --cesiumArchiveId [ARCHIVE_ID]
```

A .zip of your tileset will be downloaded and saved on the current working directory. The script will continue to upload this zip to S3 in the next step.

4. Upload tileset to your IoT TwinMaker workspace S3 bucket

Pass in the path of the downloaded tileset .zip in the following command:

```bash
npx ts-node samples/cesium_sample/sample.ts [WORKSPACE_ID] --sceneId [SCENE_ID] --localArchivePath [ZIP_PATH]
```

The zip archive will be uncompressed and uploaded to S3. The script will continue to add the tileset to an IoT TwinMaker scene in the next step.


5. Add a 3D tileset to an IoT TwinMaker scene

Assumes the tileset was already uploaded to your workspace's S3 bucket.

```bash
npx ts-node samples/cesium_sample/sample.ts --workspaceId [WORKSPACE_ID] --sceneId [SCENE_ID] --s3TilesName [TILES_FOLDER_NAME_IN_S3]
```

### Output

IoT TwinMaker scene with a node for the Cesium tileset of your 3D asset.

### Supported file formats

You can upload any of the following file types to Cesium Ion through the sample script:

- GLTF, GLB, OBJ, FBX, DAE (3D Model), or LAS, LAZ (Point Cloud)
