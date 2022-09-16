import { DistanceUnit, ModelType } from '../../utils/types';
import { ModelRef } from '../../components/model_ref_component';
import { SceneNode } from '../scene_node';

export class ModelRefNode extends SceneNode {
  modelRef: ModelRef;
  needUploadModel: boolean;
  modelLocalDirectoryPath: string;
  overrideModel: boolean;
  cesiumAssetId: string;

  constructor(name: string, modelFileName: string, modelType: ModelType) {
    super(name);
    this.modelRef = new ModelRef();
    this.modelRef.modelType = modelType;
    this.modelRef.unitOfMeasure = 'meters';
    this.modelRef.modelFileName = modelFileName;
    this.needUploadModel = false;
    this.addComponent(this.modelRef);
  }

  public uploadModelFromLocalIfNotExist(localPath: string): void {
    this.needUploadModel = true;
    this.modelLocalDirectoryPath = localPath;
    this.overrideModel = false;
  }

  public uploadModelFromLocal(localPath: string): void {
    this.needUploadModel = true;
    this.modelLocalDirectoryPath = localPath;
    this.overrideModel = true;
  }

  public uploadModelFromCesium(assetId: string): void {
    this.needUploadModel = true;
    this.cesiumAssetId = assetId;
    this.overrideModel = true;
  }

  public withUnitOfMeasure(unitOfMeasure: DistanceUnit): ModelRefNode {
    this.modelRef.unitOfMeasure = unitOfMeasure;
    return this;
  }

  public withCastShadow(castShadow: boolean): ModelRefNode {
    this.modelRef.castShadow = castShadow;
    return this;
  }

  public withReceiveShadow(receiveShadow: boolean): ModelRefNode {
    this.modelRef.receiveShadow = receiveShadow;
    return this;
  }
}
