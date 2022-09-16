import { EntitySummary, ListEntitiesFilters } from 'aws-sdk/clients/iottwinmaker';
import { IotTwinMakerScene } from '../scene/iot_twin_maker_scene';
import { IotTwinMakerSceneImpl } from '../scene/iot_twin_maker_scene_impl';

export interface SceneFactory {
  /**
  A method to create scene if the scene does not exist, or load the scene
  if the scene already exists in the workspace specified by workspaceId. 
  A promise of IotTwinMakerScene will be returned.
  
  The method will fail if the workspace does not exist and ResourceNotFoundException
  error will be thrown.
*/
  loadOrCreateSceneIfNotExists(workspaceId: string, sceneId: string): Promise<IotTwinMakerSceneImpl>;

  /**
  A method ot load the existing scene. A promise of IotTwinMakerScene will
  be returned.
  
  The method will fail if workspace or scene do not exist, and ResourceNotFoundException
  will be thrown.
  */
  loadScene(workspaceId: string, sceneId: string): Promise<IotTwinMakerSceneImpl>;

  /**
  A method to create scene. A promise of IotTwinMakerScene will
  be returned.
  
  The method will fail when workspace does not exist or scene already exists.
  
  @thrown ResourceNotFoundException error when the workspace does not exist.
  @thrown SceneAlreadyExists error when the scene already exists.
  */
  createScene(workspaceId: string, sceneId: string): Promise<IotTwinMakerSceneImpl>;

  /**
   * A method to save the scene.
   *
   * @thrown SceneHasBeenModifed error when the scene has been modified by someone else.
   */
  save(iotTwinMakerScene: IotTwinMakerScene): void;

  /**
   * Save the scene to the workspace regardless if original scene has been modified by
   * someone else or not.
   * @param iotTwinMakerScene
   */
  overrideSave(iotTwinMakerScene: IotTwinMakerScene): void;

  /**
   * Update the scene based on the workspace's list of entities. TwinMaker.ListEntities
   * is called with the provided filters. The callback function is then called on each
   * entity in the resulting list.
   * @param workspaceId
   * @param callback function called on each entity returned by ListEntities
   * @param filters filter for the ListEntities request
   */
  updateSceneForEntities(
    workspaceId: string,
    callback: (entitySummary: EntitySummary) => void,
    filters?: ListEntitiesFilters,
  ): void;
}
