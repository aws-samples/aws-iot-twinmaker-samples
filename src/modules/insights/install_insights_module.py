# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import boto3
import time
import datetime
import requests
import json
import argparse
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '../../modules'))
from sitewise.lib.util.SiteWiseTelemetryUtils import SiteWiseTelemetryImporter

def parse_args():
    parser = argparse.ArgumentParser( description='Imports the Simulation content into a specified workspace.')
    parser.add_argument('--workspace-id', required=False, default='CookieFactory', help='workspace to be populated')
    parser.add_argument('--endpoint-url', required=False, default=None, help='AWS IoT TwinMaker service endpoint')
    parser.add_argument('--region-name', required=False, default='us-east-1', help='AWS region name containing the workspace')
    parser.add_argument('--kda-stack-name', required=True, help='CloudFormation stack containing KDA resources')
    parser.add_argument('--sagemaker-stack-name', required=True, help='CloudFormation stack containing Sagemaker resources')

    parser.add_argument('--import-all', default=False, required=False, action='store_true', dest="import_all", help='import all data into the workspace.')
    parser.add_argument('--analyze-one-mixer', default=False, required=False, action='store_true', dest="analyze_one_mixer", help='Run insights analysis only on mixer 0 (only mixer 0 will be updated with insights related components).')
    parser.add_argument('--import-simulation-sitewise', default=False, required=False, action='store_true', dest="import_simulation_sitewise", help='Import all sitewise data for simulation from the workspace.')
    parser.add_argument('--import-anomaly-detection-sitewise', default=False, required=False, action='store_true', dest="import_anomaly_detection_sitewise", help='Import all sitewise data for anomaly detection from the workspace.')
    parser.add_argument('--import-kda-app', default=False, required=False, action='store_true', dest="import_kda_app", help='Delete all sitewise data for simulation from the workspace.')

    parser.add_argument('--delete-simulation-sitewise', default=False, required=False, action='store_true', dest="delete_simulation_sitewise", help='Delete all sitewise data for simulation from the workspace.')
    parser.add_argument('--delete-anomaly-detection-sitewise', default=False, required=False, action='store_true', dest="delete_anomaly_detection_sitewise", help='Delete all sitewise data for anomaly detection from the workspace.')
    parser.add_argument('--delete-all', default=False, required=False, action='store_true', dest="delete_all", help='Delete all simulation data from the workspace.')

    return parser.parse_args()

def main():
    def import_notebook(file_path, note_name, sagemaker_endpoint, region_name):
        with open(file_path, 'r') as f:
            export_body_json = f.read().encode().decode('utf-8-sig')
            note_json = json.loads(export_body_json)
            note_json['name'] = note_name
            text_str_1 = note_json['paragraphs'][0]['text'].encode().decode('utf-8-sig').format(region_name, sagemaker_endpoint)
            note_json['paragraphs'][0]['text'] = text_str_1
            text_str_2 = note_json['paragraphs'][1]['text'].encode().decode('utf-8-sig').format(region_name, workspace_id)
            note_json['paragraphs'][1]['text'] = text_str_2
            text_str_3 = note_json['paragraphs'][2]['text'].encode().decode('utf-8-sig').format(region_name, workspace_id)
            note_json['paragraphs'][2]['text'] = text_str_3
            for p in note_json['paragraphs']:
               if 'results' in p: # clear previous results
                   p['results'] = {}

            print("=========================")
            print(f"Importing note as [{note_name}]")
            print(note_json)
            print("=========================")
            return json.dumps(note_json)


    def create_sitewise_model_for_insights(asset_model_name, property_name):
        print('importing sitewise assets for ' + property_name)
        output_model = sitewiseImporter.create_asset_model(asset_model_name)
        output_model_id = output_model['assetModelId']
        sitewiseImporter.create_asset_model_property(output_model, property_name,
                                                 'DOUBLE')
        return output_model_id

    def create_sitewise_asset_for_insights(sitewise_model_id, asset_name):
        asset = sitewiseImporter.create_asset(asset_name, sitewise_model_id)
        return asset['assetId']

    def update_entity_with_sitewise_components(entity_id, component_name, asset_id, asset_model_id):
        try:
            update_entity = iottwinmaker.update_entity(
                componentUpdates={
                    component_name: {
                        "updateType": "CREATE",
                        "componentTypeId": "com.amazon.iotsitewise.connector",
                        "propertyUpdates": {
                            "sitewiseAssetId": {
                                "updateType": "UPDATE",
                                "value": {
                                    "stringValue": asset_id
                                }
                            },
                            "sitewiseAssetModelId": {
                                "updateType": "UPDATE",
                                "value": {
                                    "stringValue": asset_model_id
                                }
                            }
                        }
                    }
                },
                entityId = entity_id,
                workspaceId = workspace_id)
            print(update_entity)
            state = update_entity['state']
            print(f'{state}')
            while state == 'UPDATING':
                entity_description = iottwinmaker.get_entity(entityId=entity_id, workspaceId=workspace_id)
                state = entity_description['status']['state']
            print('Updating finished')
        except Exception as e:
            if 'Component '+ component_name + ' in entity ' + entity_id + ' in workspace' in str(e):
                print("entity updated")
            else:
                raise e

    def list_mixer_entities():
        list_response = iottwinmaker.list_entities(
            filters=[
                {
                    'componentTypeId': 'com.example.cookiefactory.mixer'
                },
            ],
            workspaceId = workspace_id
        )
        entity_summaries = list_response['entitySummaries']
        response = {s['entityName']: s['entityId'] for s in entity_summaries}
        print(f'List mixer entity response: {response}')
        return response

    def get_mixer_entities():
        if args.analyze_one_mixer:
            return {'Mixer_0': 'Mixer_0_cd81d9fd-3f74-437a-802b-9747ff240837'}
        else:
            return list_mixer_entities()

    def import_sitewise_components(mixers):
        ## Import SiteWise component for storing Simulation Output.
        if args.import_simulation_sitewise or args.import_all:
            simulation_sitewise_model_id = create_sitewise_model_for_insights(simulation_output_asset_model_name, 'SimulatedPower')
            for mixer_name in mixers:
                mixer_entity_id = mixers[mixer_name]
                simulation_sitewise_asset_id = create_sitewise_asset_for_insights(simulation_sitewise_model_id, f'{workspace_id}_{mixer_name}_Simulation_Output')
                update_entity_with_sitewise_components(mixer_entity_id, 'PowerSimulationOutputComponent', simulation_sitewise_asset_id, simulation_sitewise_model_id)

        # Import SiteWise component for storing Anomaly Detection Output.
        if args.import_anomaly_detection_sitewise or args.import_all:
            anomaly_detection_sitewise_model_id = create_sitewise_model_for_insights(anomaly_detection_output_asset_model_name, 'AnomalyScore')
            for mixer_name in mixers:
                mixer_entity_id = mixers[mixer_name]
                anomaly_detection_sitewise_asset_id = create_sitewise_asset_for_insights(anomaly_detection_sitewise_model_id, f'{workspace_id}_{mixer_name}_Anomaly_Detection_Output')
                update_entity_with_sitewise_components(mixer_entity_id, 'AnomalyDetectionOutputComponent', anomaly_detection_sitewise_asset_id, anomaly_detection_sitewise_model_id)

    def start_kda_app(zeppelin_app_name):
        ## START
        # aws kinesisanalyticsv2 start-application --application-name $ZEPPELIN_APP_NAME --region us-west-2
        if args.import_kda_app or args.import_all:
            kda = session.client(service_name='kinesisanalyticsv2', region_name=region_name)
            try:
                kda.start_application(
                    ApplicationName=zeppelin_app_name
                )
            except Exception as e:
                if "Application cannot be started in 'STARTING' state" in str(e):
                    pass
                elif "Application cannot be started in 'RUNNING' state" in str(e):
                    pass
                else:
                    raise e

            ## wait for RUNNING state
            # ZEPPELIN_APP_STATUS=$(aws kinesisanalyticsv2 describe-application --application-name $ZEPPELIN_APP_NAME --region us-west-2 | jq -r '.ApplicationDetail.ApplicationStatus') && while [ "$ZEPPELIN_APP_STATUS" != "RUNNING" ]; do      ZEPPELIN_APP_STATUS=$(aws kinesisanalyticsv2 describe-application --application-name $ZEPPELIN_APP_NAME --region us-west-2 | jq -r '.ApplicationDetail.ApplicationStatus') && echo "ZEPPELIN_APP_STATUS = "$ZEPPELIN_APP_STATUS;     sleep 5; done
            zeppelin_app_status = kda.describe_application(
                ApplicationName=zeppelin_app_name
            )
            while zeppelin_app_status['ApplicationDetail']['ApplicationStatus'] == 'STARTING':
                print(f"{datetime.datetime.now()} - ZEPPELIN_APP_STATUS: {zeppelin_app_status['ApplicationDetail']['ApplicationStatus']}")
                zeppelin_app_status = kda.describe_application(
                    ApplicationName=zeppelin_app_name
                )
                time.sleep(10)
            print(zeppelin_app_status['ApplicationDetail']['ApplicationStatus'])

            ## create logic sample notebook
            # PRESIGN_URL=$(aws kinesisanalyticsv2 create-application-presigned-url --application-name $ZEPPELIN_APP_NAME --url-type ZEPPELIN_UI_URL --region us-west-2 | jq -r ".AuthorizedUrl")
            presign_url = kda.create_application_presigned_url(
                ApplicationName=zeppelin_app_name,
                UrlType='ZEPPELIN_UI_URL'
            )['AuthorizedUrl']
            url_prefix = "/".join(presign_url.split('/')[0:4])
            print(url_prefix)

            print(f"PRESIGN_URL {presign_url}")
            r = requests.get(presign_url, allow_redirects=False)
            VERIFIED_COOKIE=r.headers['set-cookie'].split(";")[0]
            print(f"r.headers['set-cookie']: {r.headers['set-cookie']}")
            print(f"VERIFIED_COOKIE: {VERIFIED_COOKIE}")

            headers = {'Cookie': VERIFIED_COOKIE}
            print(f"{url_prefix}/api/notebook")
            r2 = requests.get(f"{url_prefix}/api/notebook", headers=headers)
            print(r2)
            print(f"r2.json() {r2.json()}")

            simulation_note_name = "MaplesoftSimulation_single_mixer" if args.analyze_one_mixer else "MaplesoftSimulation_all_mixers"
            ad_note_name = "AnomalyDetection_single_mixer" if args.analyze_one_mixer else "AnomalyDetection_all_mixers"

            # import Simulation Zeppelin Note (from /export output)
            print('Start importing notebook')
            SIMULATION_EXPORT_BODY = import_notebook(f'./zeppelin_notebooks/{simulation_note_name}.zpln', simulation_note_name, simulation_endpoint_name, region_name)
            ANOMALY_DETECTION_EXPORT_BODY = import_notebook(f'./zeppelin_notebooks/{ad_note_name}.zpln', ad_note_name, ad_endpoint_name, region_name)
            headers = {'Cookie': VERIFIED_COOKIE, 'Content-Type': 'application/json'}
            requests.post(f"{url_prefix}/api/notebook/import", headers=headers, data=ANOMALY_DETECTION_EXPORT_BODY)
            requests.post(f"{url_prefix}/api/notebook/import", headers=headers, data=SIMULATION_EXPORT_BODY)
            print(f"Imported note as [{simulation_note_name}] and [{ad_note_name}], see by opening Zeppelin with this link in browser:\n\n  {presign_url}\n")

    def perform_teardown():
        # Teardown section
        if args.delete_simulation_sitewise or args.delete_all:
            print('Deleting sitewise data for simulation...')
            sitewiseImporter.cleanup_sitewise(simulation_output_asset_model_name)
        if args.delete_anomaly_detection_sitewise or args.delete_all:
            print('Deleting sitewise data for anomaly detection...')
            sitewiseImporter.cleanup_sitewise(anomaly_detection_output_asset_model_name)

    def get_zepplin_app_name():
        cfn_stack_description = cfn_client.describe_stacks(StackName=args.kda_stack_name)
        cfn_stack_outputs = {x['OutputKey']:x['OutputValue'] for x in cfn_stack_description['Stacks'][0]['Outputs']}
        zeppelin_app_name = cfn_stack_outputs.get('ZeppelinAppName')
        print(zeppelin_app_name)
        return zeppelin_app_name

    def get_sagemaker_endpoints():
        sageMakerStackName = args.sagemaker_stack_name
        cfn_stack_description = cfn_client.describe_stacks(StackName=sageMakerStackName)
        cfn_stack_outputs = {x['OutputKey']:x['OutputValue'] for x in cfn_stack_description['Stacks'][0]['Outputs']}
        simulation_endpoint_name = cfn_stack_outputs.get('SimulationEndpointName')
        ad_endpoint_name = cfn_stack_outputs.get('AnomalyDetectionEndpointName')
        print('simulation_endpoint_name: ' + simulation_endpoint_name)
        print('anomaly_detection_endpoint_name: ' + ad_endpoint_name)
        return simulation_endpoint_name, ad_endpoint_name

    args = parse_args()

    session = boto3.session.Session(profile_name=None)
    region_name = args.region_name
    workspace_id = args.workspace_id
    simulation_output_asset_model_name = args.workspace_id + '__PowerSimulationOutputModel'
    anomaly_detection_output_asset_model_name = args.workspace_id + '__AnomalyDetectionOutputModel'
    sitewiseImporter = SiteWiseTelemetryImporter(args.region_name, asset_model_prefix=workspace_id)
    iottwinmaker = session.client(service_name='iottwinmaker', endpoint_url=args.endpoint_url, region_name=args.region_name)
    cfn_client = session.client(service_name='cloudformation', region_name=region_name)

    zeppelin_app_name = get_zepplin_app_name()

    simulation_endpoint_name, ad_endpoint_name = get_sagemaker_endpoints()

    mixers = get_mixer_entities()

    import_sitewise_components(mixers)

    start_kda_app(zeppelin_app_name)

    perform_teardown()

if __name__ == '__main__':
    main()