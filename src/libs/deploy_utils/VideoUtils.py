# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2021
# SPDX-License-Identifier: Apache-2.0

import boto3
import time
import hmac
import hashlib
import datetime
import requests 
import os
import glob
import cv2
import uuid

class VideoUtils:
    def __init__(self, region_name, profile=None):
        self.session = boto3.session.Session(profile_name=profile)

        self.kinesisvideo = self.session.client('kinesisvideo', region_name=region_name)
        self.iotsitewise = self.session.client('iotsitewise')
        self.secretsmanager = self.session.client('secretsmanager')

        # Please do not change these values. Otherwise EdgeConnectorForKVS could not set start correctly.
        self.sitewise_asset_model_name_hub_prefix = 'EdgeConnectorForKVSHubModel'
        self.sitewise_asset_model_name_camera_prefix = 'EdgeConnectorForKVSCameraModel'

        self.hubs = []
        self.cameras = []
        self.sitewise_asset_model_id_hub = ''
        self.sitewise_asset_model_id_camera = ''
        self.hub_asset_model_hierarchy_id = ''

    def update_camera_assets_with_kvs_stream_names(self, stream_names):
        self.check_or_create_sitewise_asset_model()
        self.list_exists_assets()
        for stream_name in stream_names:
            self.check_or_create_camera_asset(camera_name=stream_name, kvs_stream_name=stream_name)

    def upload_all_mkv_files(self, dir_name, rebase_time_ms=None):
        # loop through all the mkv files
        files = glob.glob(os.path.join(dir_name, '*.mkv'))
        kvs_stream_names = []
        current_timestamp = time.time()
        for i, file in enumerate(files):
            # take just the filename from the path
            filename = os.path.split(file)[1]
            # remove extension and partition out the timestamp
            # myvideo_1633046400.mkv >> ('myvideo', '_', 1633046400)
            (stream_name, delim, time_stamp) = os.path.splitext(filename)[0].rpartition("_")
            time_stamp_in_seconds = VideoUtils.get_epoch_time_in_seconds(time_stamp)
            if rebase_time_ms is not None:
                # Rebase time to current time minus video duration
                time_stamp_in_seconds = str(round(rebase_time_ms/1000))
            self.upload_video(file_name=os.path.join(dir_name,file), stream_name=stream_name, start_tmstp=time_stamp_in_seconds)
            kvs_stream_names.append(stream_name)
        return kvs_stream_names

    def upload_video(self, file_name, stream_name, start_tmstp:str=repr(time.time()), retention_in_hours=24*30):
        print(f"   uploading {os.path.split(file_name)[1]} to {stream_name} @ {start_tmstp} ({datetime.datetime.fromtimestamp(float(start_tmstp), datetime.timezone.utc).strftime('%Y-%m-%d %H:%M:%S %Z')})")
        try:
            response = self.kinesisvideo.create_stream(StreamName=stream_name, DataRetentionInHours=retention_in_hours)
        except Exception as e:
            if f"The stream {stream_name} already exists" in str(e):
                print(f"   using prexisting stream for {stream_name}")
            else:
                raise e
        # get the endpoint for putMedia 
        response = self.kinesisvideo.get_data_endpoint(StreamName=stream_name,APIName='PUT_MEDIA')
        endpoint = response.get('DataEndpoint', None)
        host = VideoUtils.get_host_from_endpoint(endpoint)
        endpoint += '/putMedia'
        
        service = 'kinesisvideo'
        region = self.session.region_name
        content_type = 'application/json'

        # Create a date for headers and the credential string
        t = datetime.datetime.utcnow()
        amz_date = t.strftime('%Y%m%dT%H%M%SZ')
        date_stamp = t.strftime('%Y%m%d')  # Date w/o time, used in credential scope

        # ************* TASK 1: CREATE A CANONICAL REQUEST *************
        # http://docs.aws.amazon.com/general/latest/gr/sigv4-create-canonical-request.html

        # Step 1 is to define the verb (GET, POST, etc.)
        method = 'POST'
        
        # Step 2: Create canonical URI--the part of the URI from domain to query
        canonical_uri = '/putMedia'

        # Step 3: Create the canonical query string. In this example, request
        # parameters are passed in the body of the request and the query string
        # is blank.
        canonical_querystring = ''

        # Step 4: Create the canonical headers. Header names must be trimmed
        # and lowercase, and sorted in code point order from low to high.
        canonical_headers = ''
        canonical_headers += 'connection:keep-alive\n'
        canonical_headers += 'content-type:application/json\n'
        canonical_headers += 'host:' + host + '\n'
        canonical_headers += 'transfer-encoding:chunked\n'
        canonical_headers += 'user-agent:AWS-SDK-KVS/2.0.2 GCC/7.4.0 Linux/4.15.0-46-generic x86_64\n'
        canonical_headers += 'x-amz-date:' + amz_date + '\n'
        canonical_headers += 'x-amzn-fragment-acknowledgment-required:1\n'
        canonical_headers += 'x-amzn-fragment-timecode-type:RELATIVE\n'
        canonical_headers += 'x-amzn-producer-start-timestamp:' + start_tmstp + '\n'
        canonical_headers += 'x-amzn-stream-name:' + stream_name + '\n'

        # Step 5: Create the list of signed headers. This lists the headers
        # in the canonical_headers list, delimited with ";" and in alpha order.
        # Note: The request can include any headers; canonical_headers and
        # signed_headers include those that you want to be included in the
        # hash of the request. "Host" and "x-amz-date" are always required.
        signed_headers = 'connection;content-type;host;transfer-encoding;user-agent;'
        signed_headers += 'x-amz-date;x-amzn-fragment-acknowledgment-required;'
        signed_headers += 'x-amzn-fragment-timecode-type;x-amzn-producer-start-timestamp;x-amzn-stream-name'

        # Step 6: Create payload hash. In this example, the payload (body of
        # the request) contains the request parameters.

        # Step 7: Combine elements to create canonical request
        canonical_request = method + '\n' + canonical_uri + '\n' + canonical_querystring + '\n' + canonical_headers + '\n' + signed_headers
        canonical_request += '\n'
        canonical_request += hashlib.sha256(''.encode('utf-8')).hexdigest()

        # ************* TASK 2: CREATE THE STRING TO SIGN*************
        # Match the algorithm to the hashing algorithm you use, either SHA-1 or
        # SHA-256 (recommended)
        algorithm = 'AWS4-HMAC-SHA256'
        credential_scope = date_stamp + '/' + region + '/' + service + '/' + 'aws4_request'
        string_to_sign = algorithm + '\n' + amz_date + '\n' + credential_scope + '\n' + hashlib.sha256(
            canonical_request.encode('utf-8')).hexdigest()

        # ************* TASK 3: CALCULATE THE SIGNATURE *************
        # Create the signing key using the function defined above.
        credentials = self.session.get_credentials()
        current_credentials = credentials.get_frozen_credentials()
        access_key = current_credentials.access_key
        secret_key = current_credentials.secret_key
        token = current_credentials.token
        signing_key = VideoUtils.get_signature_key(secret_key, date_stamp, region, service)

        # Sign the string_to_sign using the signing_key
        signature = hmac.new(signing_key, (string_to_sign).encode('utf-8'),
                            hashlib.sha256).hexdigest()

        # ************* TASK 4: ADD SIGNING INFORMATION TO THE REQUEST *************
        # Put the signature information in a header named Authorization.
        authorization_header = algorithm + ' ' + 'Credential=' + access_key + '/' + credential_scope + ', '
        authorization_header += 'SignedHeaders=' + signed_headers + ', ' + 'Signature=' + signature

        # # Python note: The 'host' header is added automatically by the Python 'requests' library.
        headers = {
            'Accept': '*/*',
            'Authorization': authorization_header,
            'connection': 'keep-alive',
            'content-type': content_type,
            'transfer-encoding': 'chunked',
            'user-agent': 'AWS-SDK-KVS/2.0.2 GCC/7.4.0 Linux/4.15.0-46-generic x86_64',
            'x-amz-date': amz_date,
            'x-amzn-fragment-acknowledgment-required': '1',
            'x-amzn-fragment-timecode-type': 'RELATIVE',
            'x-amzn-producer-start-timestamp': start_tmstp,
            'x-amzn-stream-name': stream_name,
            'Expect': '100-continue'
        }
        if current_credentials.token is not None:
            headers['x-amz-security-token'] = token

        # ************* SEND THE REQUEST *************
        # print('\nBEGIN REQUEST++++++++++++++++++++++++++++++++++++')
        # print('   Request URL = ' + endpoint)
        r = requests.post(endpoint, data=VideoUtils.gen_request_parameters(file_name=file_name), headers=headers)
        # print('\nRESPONSE++++++++++++++++++++++++++++++++++++')
        # print('   Response code: %d\n' % r.status_code)
        # print(r.text)

    class gen_request_parameters:
        def __init__(self, file_name):
            self._data = ''
            if True:
                with open(file_name, 'rb') as image:
                    request_parameters = image.read()
                    self._data = request_parameters
            self._pointer = 0
            self._size = len(self._data)
        def __iter__(self):
            return self
        def __next__(self):
            if self._pointer >= self._size:
                raise StopIteration  # signals "the end"
            left = self._size - self._pointer
            chunksz = 16000
            if left < 16000:
                chunksz = left
            pointer_start = self._pointer
            self._pointer += chunksz
            #print("Data: chunk size %d" % chunksz)
            return self._data[pointer_start:self._pointer]

    @staticmethod
    def sign(key, msg):
        return hmac.new(key, msg.encode("utf-8"), hashlib.sha256).digest()

    @staticmethod
    def get_signature_key(key, date_stamp, regionName, serviceName):
        kDate = VideoUtils.sign(('AWS4' + key).encode('utf-8'), date_stamp)
        kRegion = VideoUtils.sign(kDate, regionName)
        kService = VideoUtils.sign(kRegion, serviceName)
        kSigning = VideoUtils.sign(kService, 'aws4_request')
        return kSigning

    @staticmethod
    def get_host_from_endpoint(endpoint):
        # u'https://123456.kinesisvideo.us-east-2.amazonaws.com'
        if not endpoint.startswith('https://'):
            return None
        retv = endpoint[len('https://'):]
        return str(retv)

    @staticmethod
    def _current_milli_time():
        return int(round(time.time() * 1000))

    @staticmethod
    def get_epoch_time_in_seconds(timestamp):
        if len(timestamp) >= 13:
            # The time unit is millisecond, convert it to second
            timestamp_in_seconds = timestamp[:-3] + '.' + timestamp[-3:]
        else:
            # The time unit should be second, do nothing on it
            timestamp_in_seconds = timestamp
        return timestamp_in_seconds

    @staticmethod
    def get_video_duration(filename):
        video = cv2.VideoCapture(filename)
        fps = video.get(cv2.CAP_PROP_FPS)
        frame_count = video.get(cv2.CAP_PROP_FRAME_COUNT)
        duration = frame_count / fps
        video.release()
        return duration

    # First verify if EdgeConnectorForKVSHubModel and EdgeConnectorForKVSCameraModel exists
    # If not, create these models with 4 digital hash suffix
    # If yes, use the existing models
    def check_or_create_sitewise_asset_model(self):
        if(not self.is_sitewise_asset_model_exist(self.sitewise_asset_model_name_camera_prefix)):
            self.create_sitewise_camera_asset_model()
            print("Created sitewise asset model for camera")
        else:
            print("Already have sitewise asset model for camera, skip creation and use existing model")

        if(not self.is_sitewise_asset_model_exist(self.sitewise_asset_model_name_hub_prefix)):
            self.create_sitewise_hub_asset_model()
            print("Created sitewise asset model for hub")
        else:
            self.check_or_create_asset_model_hierarchy_id()
            print("Already have sitewise asset model for hub, skip creation and use existing model")

    # Verify if given model exists
    def is_sitewise_asset_model_exist(self, model_name):
        next_token = ""
        while True:
            if not next_token:
                response = self.iotsitewise.list_asset_models(maxResults=50)
            else:
                response = self.iotsitewise.list_asset_models(maxResults=50, nextToken=next_token)
            for asset_model in response.get("assetModelSummaries"):
                if model_name in asset_model.get("name"):
                    if "Hub" in model_name:
                        self.sitewise_asset_model_id_hub = asset_model.get("id")
                    else:
                        self.sitewise_asset_model_id_camera = asset_model.get("id")
                    return True
            next_token = response.get("nextToken")
            if not next_token:
                break
        return False

    # Create EdgeConnectorForKVSCameraModel with 4 digital hash suffix
    def create_sitewise_camera_asset_model(self):
        assetModelNameValue = 'EdgeConnectorForKVSCameraModel-' + uuid.uuid4().hex[0:4]
        response = self.iotsitewise.create_asset_model(
            assetModelName = assetModelNameValue,
            assetModelDescription='Camera Device for EdgeConnectorForKVS',
            assetModelProperties=[
                {
                    'name': 'KinesisVideoStreamName',
                    'dataType': 'STRING',
                    'type': {
                        'attribute': {
                            'defaultValue': '<Replace with KVS stream name>'
                        },
                    }
                },
                {
                    'name': 'RTSPStreamSecretARN',
                    'dataType': 'STRING',
                    'type': {
                        'attribute': {
                            'defaultValue': '<Replace with Secret Arn including RTSP Stream URL>'
                        },
                    }
                },
                {
                    'name': 'LocalDataRetentionPeriodInMinutes',
                    'dataType': 'INTEGER',
                    'type': {
                        'attribute': {
                            'defaultValue': '60'
                        },
                    }
                },
                {
                    'name': 'LiveStreamingStartTime',
                    'dataType': 'STRING',
                    'type': {
                        'attribute': {
                            'defaultValue': '-'
                        },
                    }
                },
                {
                    'name': 'LiveStreamingDurationInMinutes',
                    'dataType': 'INTEGER',
                    'type': {
                        'attribute': {
                            'defaultValue': '0'
                        },
                    }
                },
                {
                    'name': 'CaptureStartTime',
                    'dataType': 'STRING',
                    'type': {
                        'attribute': {
                            'defaultValue': '-'
                        },
                    }
                },
                {
                    'name': 'CaptureDurationInMinutes',
                    'dataType': 'INTEGER',
                    'type': {
                        'attribute': {
                            'defaultValue': '0'
                        },
                    }
                },
                {
                    'name': 'VideoUploadRequest',
                    'dataType': 'STRING',
                    'type': {
                        'measurement': {},
                    }
                },
                {
                    'name': 'VideoUploadedTimeRange',
                    'dataType': 'DOUBLE',
                    'type': {
                        'measurement': {},
                    }
                },
                {
                    'name': 'VideoRecordedTimeRange',
                    'dataType': 'DOUBLE',
                    'type': {
                        'measurement': {},
                    }
                },
                {
                    'name': 'CachedVideoAgeOutOnEdge',
                    'dataType': 'DOUBLE',
                    'type': {
                        'measurement': {},
                    }
                },
            ],
        )
        self.sitewise_asset_model_id_camera = response.get('assetModelId')
        waiter = self.iotsitewise.get_waiter('asset_model_active')
        waiter.wait(assetModelId=self.sitewise_asset_model_id_camera)

    # Create EdgeConnectorForKVSHubModel with 4 digital hash suffix
    def create_sitewise_hub_asset_model(self):
        asset_model_name = 'EdgeConnectorForKVSHubModel-' + uuid.uuid4().hex[0:4]
        response = self.iotsitewise.create_asset_model(
                    assetModelName = asset_model_name,
                    assetModelDescription='Hub Device for EdgeConnectorForKVS',
                    assetModelProperties=[
                        {
                            'name': 'HubName',
                            'dataType': 'STRING',
                            'type': {
                                'attribute': {
                                    'defaultValue': 'Hub Name'
                                },
                            }
                        },
                    ],
                    assetModelHierarchies=[
                        {
                            'name': 'ConnectedCameras',
                            'childAssetModelId': self.sitewise_asset_model_id_camera
                        },
                    ],
                )
        self.sitewise_asset_model_id_hub = response.get('assetModelId')
        waiter = self.iotsitewise.get_waiter('asset_model_active')
        waiter.wait(assetModelId=self.sitewise_asset_model_id_hub)

    def get_camera_asset_id(self, camera_name):
        for camera_asset in self.cameras:
            if camera_asset['name'] == camera_name:
                return camera_asset['id']
        return None

    def list_exists_assets(self):
        self.list_exists_hub_assets()
        self.list_exists_camera_assets()

    def list_exists_hub_assets(self):
        self.hubs = []
        nextTokenValue = ""
        while True:
            if not nextTokenValue:
                response = self.iotsitewise.list_assets(maxResults=100, assetModelId=self.sitewise_asset_model_id_hub)
            else:
                response = self.iotsitewise.list_assets(maxResults=100, assetModelId=self.sitewise_asset_model_id_hub, nextToken=nextTokenValue)
            for hub_asset in response.get("assetSummaries"):
                self.hubs.append(hub_asset)
            nextTokenValue = response.get("nextToken")
            if not nextTokenValue:
                break
        # print('list hub assets')
        # print(self.hubs)

    def list_exists_camera_assets(self):
        self.cameras = []
        nextTokenValue = ""
        while True:
            if not nextTokenValue:
                response = self.iotsitewise.list_assets(maxResults=100, assetModelId=self.sitewise_asset_model_id_camera)
            else:
                response = self.iotsitewise.list_assets(maxResults=100, assetModelId=self.sitewise_asset_model_id_camera, nextToken=nextTokenValue)
            for camera_asset in response.get("assetSummaries"):
                self.cameras.append(camera_asset)
            nextTokenValue = response.get("nextToken")
            if not nextTokenValue:
                break
        # print('list camera assets')
        # print(self.cameras)

    def update_sitewise_property(self, assetId, propertyId, propertyValues):
        property_pairs = self.generate_property_values_content(propertyValues)
        response = self.iotsitewise.batch_put_asset_property_value(
            entries=[
                {
                    'entryId': assetId + uuid.uuid4().hex[0:4],
                    'assetId': assetId,
                    'propertyId': propertyId,
                    'propertyValues': [
                        {
                            'value': {
                                property_pairs[0]: property_pairs[1]
                            },
                            'timestamp': {
                                'timeInSeconds': int(time.time()),
                                'offsetInNanos': 0
                            },
                            'quality': 'GOOD'
                        },
                    ]
                },
            ]
        )

    # Auto match given propertyValues into target sitewise value type
    def generate_property_values_content(self, propertyValues):
        result = {}
        if type(propertyValues) == str:
            result['stringValue'] = propertyValues
        elif type(propertyValues) == int:
            result['integerValue'] = propertyValues
        elif type(propertyValues) == float:
            result['doubleValue'] = propertyValues
        else:
            result['booleanValue'] = propertyValues
        dict_pairs = result.items()
        pairs_iterator = iter(dict_pairs)
        return next(pairs_iterator)

    # Check if camera model is associated with hub model
    def check_or_create_asset_model_hierarchy_id(self):
        self.hub_asset_model_hierarchy_id = ''
        hub_asset_model = self.iotsitewise.describe_asset_model(assetModelId = self.sitewise_asset_model_id_hub)
        # print(json.dumps(hub_asset_model, indent=4, sort_keys=True, default=str))
        for assetModelHierarchy in hub_asset_model.get('assetModelHierarchies'):
            if assetModelHierarchy.get('name') in 'ConnectedCameras':
                self.hub_asset_model_hierarchy_id = assetModelHierarchy.get('id')
                break
        if not self.hub_asset_model_hierarchy_id:
            asset_model_hierarchies = hub_asset_model.get('assetModelHierarchies')
            asset_model_hierarchies.append({
                'name': 'ConnectedCameras',
                'childAssetModelId': self.sitewise_asset_model_id_camera}
            )
            response = self.iotsitewise.update_asset_model(
                assetModelId = self.sitewise_asset_model_id_hub,
                assetModelName = hub_asset_model.get('assetModelName'),
                assetModelDescription = hub_asset_model.get('assetModelDescription'),
                assetModelProperties = hub_asset_model.get('assetModelProperties'),
                assetModelHierarchies = asset_model_hierarchies,
                assetModelCompositeModels = hub_asset_model.get('assetModelCompositeModels')
            )
            waiter = self.iotsitewise.get_waiter('asset_model_active')
            waiter.wait(assetModelId=self.sitewise_asset_model_id_hub)
            print('Associated camera asset model to hub asset model')
            hub_asset_model = self.iotsitewise.describe_asset_model(assetModelId = self.sitewise_asset_model_id_hub)
            # print(json.dumps(hub_asset_model, indent=4, sort_keys=True, default=str))
            for assetModelHierarchy in hub_asset_model.get('assetModelHierarchies'):
                if assetModelHierarchy.get('name') in 'ConnectedCameras':
                    self.hub_asset_model_hierarchy_id = assetModelHierarchy.get('id')
                    break

    def get_property_id(self, camera_model_id, property_name):
        camera_asset_model = self.iotsitewise.describe_asset_model(assetModelId=camera_model_id)
        for asset_model_property in camera_asset_model['assetModelProperties']:
            if (asset_model_property['name'] == property_name):
                return asset_model_property['id']
        return None

    # Update SiteWise property
    def update_sitewise_property(self, assetId, propertyId, propertyValues):
        property_pairs = self.generate_property_values_content(propertyValues)
        response = self.iotsitewise.batch_put_asset_property_value(
            entries=[
                {
                    'entryId': assetId + uuid.uuid4().hex[0:4],
                    'assetId': assetId,
                    'propertyId': propertyId,
                    'propertyValues': [
                        {
                            'value': {
                                property_pairs[0]: property_pairs[1]
                            },
                            'timestamp': {
                                'timeInSeconds': int(time.time()),
                                'offsetInNanos': 0
                            },
                            'quality': 'GOOD'
                        },
                    ]
                },
            ]
        )

    # Check if there is any camera asset name equals KVS stream name
    # If no, create a camera asset and associate it to the first hub
    # Then update the camera KVS stream name property 
    def check_or_create_camera_asset(self, camera_name, kvs_stream_name):
        camera_asset_id = self.get_camera_asset_id(camera_name)
        if camera_asset_id is None:
            response = self.iotsitewise.create_asset(assetName=camera_name, assetModelId=self.sitewise_asset_model_id_camera)
            camera_asset_id = response['assetId']
            waiter = self.iotsitewise.get_waiter('asset_active')
            waiter.wait(assetId=camera_asset_id)
            print('Created camera asset \"' + camera_name + "\"")

            if len(self.hubs) == 0:
                response = self.iotsitewise.create_asset(assetName='CookieFactoryHubAsset', assetModelId=self.sitewise_asset_model_id_hub)
                hub_asset_id = response['assetId']
                waiter = self.iotsitewise.get_waiter('asset_active')
                waiter.wait(assetId=hub_asset_id)
                self.list_exists_hub_assets()
                print('Created hub asset \"CookieFactoryHubAsset\"')

            # Select first hub asset and associate this camera to it
            hub_asset_id = self.hubs[0]['id']
            hierarchy_id_value = self.hub_asset_model_hierarchy_id
            if hierarchy_id_value:
                self.iotsitewise.associate_assets(assetId=hub_asset_id, hierarchyId=hierarchy_id_value, childAssetId=camera_asset_id)

            self.list_exists_camera_assets()
        
        kinesis_video_stream_name_property_id = self.get_property_id(self.sitewise_asset_model_id_camera, 'KinesisVideoStreamName')
        self.update_sitewise_property(camera_asset_id, kinesis_video_stream_name_property_id, kvs_stream_name)
        print('Updated KVS stream name \"' + kvs_stream_name + '\" to camera \"' + camera_name + '\"')

