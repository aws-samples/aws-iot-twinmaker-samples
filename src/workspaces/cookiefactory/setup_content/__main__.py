# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2021
# SPDX-License-Identifier: Apache-2.0

import argparse
import os
import sys
import datetime

try:
    from ....libs import deploy_utils
    from ....modules.timestream_telemetry import libs as timestream_libs
except:
    sys.path.append(os.path.join(os.path.dirname(__file__), '../../../libs'))
    sys.path.append(os.path.join(os.path.dirname(__file__), '../../../modules'))
    import deploy_utils
    import timestream_telemetry.lib as timestream_libs


def parse_args():
    parser = argparse.ArgumentParser( description='Imports the CookieFactory content into a specified workspace.')

    parser.add_argument('--profile', required=False, default=None, help="(optional) AWS profile to access your account with. See your configured profiles with `~/.aws/credentials`. Defaults to 'default'")
    parser.add_argument('--endpoint-url', required=False, default=None, help='AWS IoT TwinMaker service endpoint')
    parser.add_argument('--region-name', required=False, default='us-east-1', help='AWS region name containing the workspace')
    parser.add_argument('--workspace-id', required=False, default='CookieFactory', help='workspace to be populated')
    parser.add_argument('--content-root', required=False, default='..', help='content directory relative to this module')

    parser.add_argument('--telemetry-database-name', required=False, default='CookieFactoryTelemetry', help='timestream telemetry database name')
    parser.add_argument('--telemetry-table-name', required=False, default='Telemetry', help='timestream telemetry table name')
    parser.add_argument('--telemetry-stack-name', required=False, default=None, help='Name of the Cloudformation stack where CookieFactory resources (like Timestream and Lambda) were created')
    parser.add_argument('--telemetry-rebase-time', default=False, required=False, action='store_true', dest="telemetry_rebase_time", help='Rebase the imported data to start from now.')
    parser.add_argument('--content-start-time', default=None, type=int, required=False, dest="content_start_time", help='Rebase the imported content to start from this time. For samples, tries to lookup the last used time from workspace description. Otherwise defaults to 10 minutes before this script was run.')

    parser.add_argument('--delete-entities', default=False, required=False, action='store_true', dest="delete_entities", help='Delete all entities from the workspace.')
    parser.add_argument('--delete-component-types', default=False, required=False, action='store_true', dest="delete_component_types", help='Delete all component types from the workspace.')
    parser.add_argument('--delete-scenes', default=False, required=False, action='store_true', dest="delete_scenes", help='Delete all scenes from the workspace.')
    parser.add_argument('--delete-models', default=False, required=False, action='store_true', dest="delete_models", help='Delete all models from the workspace.')
    parser.add_argument('--delete-telemetry', default=False, required=False, action='store_true', dest="delete_telemetry", help='Delete all telemetry from the workspace.')
    parser.add_argument('--delete-video', default=False, required=False, action='store_true', dest="delete_video", help='Delete all video from the workspace.')
    parser.add_argument('--delete-workspace-role-and-bucket', default=False, required=False, action='store_true', dest="delete_workspace_role_and_bucket", help='Delete all contents from workspace S3 bucket and the workspace role, then delete the workspace itself.')
    parser.add_argument('--delete-all', default=False, required=False, action='store_true', dest="delete_all", help='Delete all data from the workspace.')

    parser.add_argument('--import-component-types', default=False, required=False, action='store_true', dest="import_component_types", help='import all component types into the workspace.')
    parser.add_argument('--import-entities', default=False, required=False, action='store_true', dest="import_entities", help='import all entities into the workspace.')
    parser.add_argument('--import-scenes', default=False, required=False, action='store_true', dest="import_scenes", help='import all scenes into the workspace.')
    parser.add_argument('--import-models', default=False, required=False, action='store_true', dest="import_models", help='import all models into the workspace.')
    parser.add_argument('--import-telemetry', default=False, required=False, action='store_true', dest="import_telemetry", help='import all telemetry into the workspace.')
    parser.add_argument('--import-video', default=False, required=False, action='store_true', dest="import_video", help='import all video into the workspace.')
    parser.add_argument('--import-all', default=False, required=False, action='store_true', dest="import_all", help='import all data into the workspace.')

    return parser.parse_args()

# to make scripts resumable, we store sample content start time as a tag in the workspace resource, here we manage access to it
def get_content_start_time(ws, args_content_start_time):
    ws_content_start_time = ws.fetch_sample_metadata("samples_content_start_time")
    if ws_content_start_time is None:
        if args_content_start_time is None:
            ten_min_ago = datetime.datetime.now() - datetime.timedelta(minutes = 10)
            content_start_time = round(ten_min_ago.timestamp()*1000)
        else:
            content_start_time = args_content_start_time
        ws.store_sample_metadata("samples_content_start_time", str(content_start_time))
    else:
        content_start_time = ws_content_start_time
    return datetime.datetime.fromtimestamp(float(content_start_time)/1000.0)

def main():
    args = parse_args()

    # helper function to build paths to files nested within the passed in content root
    content_root = os.path.join(os.path.dirname(__file__), args.content_root)

    def content_path(relative_path):
        return os.path.join(content_root, relative_path)

    # this helper object does all the heavy lifting on workspaces for us
    ws = deploy_utils.WorkspaceUtils(
                workspace_id=args.workspace_id,
                region_name=args.region_name,
                endpoint_url=args.endpoint_url,
                profile=args.profile)

    content_start_time = get_content_start_time(ws, args.content_start_time)
    content_start_time_ms = int(round(content_start_time.timestamp()*1000))
    timestamp_string = datetime.datetime.fromtimestamp(content_start_time.timestamp(), datetime.timezone.utc).strftime('%Y-%m-%d %H:%M:%S %Z')
    print(f"using following timestamp for data ingestion: {timestamp_string} ({content_start_time_ms}ms from epoch)")

    # this helper object does all the heavy lifting timestream telemetry for us
    telemetry = timestream_libs.TimestreamTelemetryImporter(
                region_name=args.region_name,
                database_name=args.telemetry_database_name,
                table_name=args.telemetry_table_name,
                stack_name=args.telemetry_stack_name,
                profile=args.profile)

    ####################################################################
    # We run teardown steps first.
    # Delete entities (must happen before delete types)
    if args.delete_entities or args.delete_all:
        print('Deleting entities...')
        ws.delete_all_entities()

    # Delete component types
    if args.delete_component_types or args.delete_all:
        ws.delete_all_component_types()

    # Delete scenes
    if args.delete_scenes or args.delete_all:
        print('Deleting scenes...')
        ws.delete_all_scenes()

    # Delete models - this will be handled by bucket cleanup
    if args.delete_models or args.delete_all:
        print('Deleting models...')
        ws.delete_resource(destination='CookieFactoryMixer.glb')
        ws.delete_resource(destination='CookieFactoryWaterTank.glb')
        ws.delete_resource(destination='CookieFactoryLine.glb')
        ws.delete_resource(destination='CookieFactoryEnvironment.glb')

    # Delete telemetry data
    if args.delete_telemetry or args.delete_all:
        print('Deleting sample telemetry data...')
        telemetry.recreate_table()

    # Sample video data may be shared by multiple samples so we don't delete it, instead we rely on KVS retention period

    # deleting workspace requires deleting all content so ensure that flag is also set
    # workspace is not created as part of this setup script so have it be explicit separate flag
    if args.delete_all and args.delete_workspace_role_and_bucket:
        print('Deleting workspace role and bucket...')
        ws.delete_workspace_role_and_bucket()

    ####################################################################
    # Now run import steps.  Skipped steps above may cause failures.

    # Import component types
    if args.import_component_types or args.import_all:
        print('Importing component types...')
        ws.import_component_type(content_path('../../modules/timestream_telemetry/component-types/timestream_component_type.json'), telemetry.lambda_arn)
        ws.import_component_type(content_path('component_types/alarm_component_type.json'), telemetry.lambda_arn)
        ws.import_component_type(content_path('component_types/mixer_component_type.json'))
        ws.import_component_type(content_path('component_types/watertank_component_type.json'))
        ws.import_component_type(content_path('component_types/space_component_type.json'))

    # Import entities
    if args.import_entities or args.import_all:
        print('Importing entities...')
        ws.import_entities(content_path('entities/entities.json'))

    # Import scenes
    if args.import_scenes or args.import_all:
        print('Importing scenes...')
        ws.import_scene(file_name=content_path('scenes/CookieFactory.json'), scene_name='CookieFactory')
        ws.import_scene(file_name=content_path('scenes/Mixer.json'), scene_name='Mixer')

    # Import models
    if args.import_models or args.import_all:
        print('Importing models...')
        ws.import_resource(file_name=content_path('scenes/CookieFactoryMixer.glb'), destination='CookieFactoryMixer.glb')
        ws.import_resource(file_name=content_path('scenes/CookieFactoryWaterTank.glb'), destination='CookieFactoryWaterTank.glb')
        ws.import_resource(file_name=content_path('scenes/CookieFactoryLine.glb'), destination='CookieFactoryLine.glb')
        ws.import_resource(file_name=content_path('scenes/CookieFactoryEnvironment.glb'), destination='CookieFactoryEnvironment.glb')

    # Import telemetry data
    if args.import_telemetry or args.import_all:
        print('Importing sample telemetry data...')
        telemetry.recreate_table()
        telemetry.import_csv(content_path('sample_data/telemetry/telemetry.csv'), rebase_time_ms=content_start_time_ms)

    # Import video data
    if args.import_video or args.import_all:
        print('Importing video data...')
        video_utils = deploy_utils.VideoUtils(args.region_name, profile=args.profile)
        video_dir = content_path('sample_data/video')
        kvs_stream_names = video_utils.upload_all_mkv_files(dir_name=video_dir, rebase_time_ms=content_start_time_ms)

if __name__ == '__main__':
    main()
