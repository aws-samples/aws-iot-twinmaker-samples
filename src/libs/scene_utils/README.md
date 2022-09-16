# IoT TwinMaker Scene SDK

## License Notice

Amazon is planning to release this code under an open source license to the general public in the future. As a condition of accessing and using this code prior to its public open source release, you agree that until such public open source release (i) this code is considered as Amazon’s Confidential Information under your MNDA with Amazon and you may not disclose any information about this code or redistribute any portion of this code to any third party, and (ii) your rights to use, copy, and prepare Derivative Works of the code are limited to internal uses only. If you do not agree with these terms, you may not access or use the code. These terms must accompany all copies of the code that you distribute internally until the public open source release. Subject to your compliance with the above terms, this code is provided to you under the terms of the Apache 2.0 license.

## Use

This package provides sample command line scripts that automate the creation of IoT TwinMaker scenes. Upload 3D assets and place them in a 3D scene connected to IoT data via augmented widgets (tag, motion indicator, etc.).

# Samples:

## 1. COOKIE FACTORY `samples/cookie_factory_sample/`

Use the models in the `scenes` directory for the `--assetDirPath` input.

### Example

If running this script from the root of `aws-iot-twinmaker-samples`:

```
npx ts-node src/libs/scene_utils/samples/cookie_factory_sample/sample.ts --workspaceId [WORKSPACE_ID] --sceneId [SCENE_ID] --assetDirPath src/workspaces/cookiefactory/scenes/
```

### Output

CookieFactory TwinMaker scene with Mixer nodes tied to data, Cookie Line nodes, and a WaterTank with a Motion Indicator widget.

You will need to finish the Getting Started sample [setup](https://github.com/aws-samples/aws-iot-twinmaker-samples/blob/main/README.md) for the scene to be connected to data.

---

## 2. CESIUM `samples/cesium_sample/`

Automates the Cesium Ion pipeline to export directly to TwinMaker.

1. Upload your 3D asset to Cesium and wait for it to perform a tiling optimization.
2. Download the tileset for the asset and upload it to your workspace's S3 bucket.
3. Create/edit a TwinMaker scene with the 3D tileset

### Example

1. Upload a 3D asset to Cesium

```
npx ts-node src/libs/scene_utils/samples/cesium_sample/sample.ts --workspaceId [WORKSPACE_ID] --sceneId [SCENE_ID] --assetFilePath [3D_ASSET_PATH] --cesiumAccessToken [ACCESS_TOKEN]
```

The script will wait up to 5 minutes for Cesium to process the asset's tiles. If it takes more than 5 minutes then run the next command below.

2. Download Cesium tiles and export them into a TwinMaker scene

```
npx ts-node src/cesium_sample/sample.ts --workspaceId [WORKSPACE_ID] --sceneId [SCENE_ID] --cesiumAccessToken [ACCESS_TOKEN] --cesiumAssetId [ASSET_ID]
```

### Output

TwinMaker scene with a node for the Cesium tileset of your 3D asset

### Supported file formats

You can upload any of the following file types to Cesium Ion through the sample script:

- GLTF, GLB, OBJ, FBX, DAE (3D Model), or LAS, LAZ (Point Cloud)

---

## 3. DELETE `src/delete_sample/`

Delete nodes in your scene or the entire scene file.

### Example

1. Delete all nodes in your scene

```
npx ts-node src/delete_sample/sample_delete.ts --workspaceId [WORKSPACE_ID] --sceneId [SCENE_ID]
```

2. Delete the scene in TwinMaker and S3

```
npx ts-node src/delete_sample/sample_delete.ts --workspaceId [WORKSPACE_ID] --sceneId [SCENE_ID] --deleteAll
```
