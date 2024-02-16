# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2021
# SPDX-License-Identifier: Apache-2.0

import boto3
import time
import hmac
import hashlib
import datetime
import requests 
import os
import cv2

class VideoUtils:
    def __init__(self, region_name, profile=None):
        self.session = boto3.session.Session(profile_name=profile)
        self.kinesisvideo = self.session.client('kinesisvideo', region_name=region_name)

    def upload_video(self, file_name, stream_name, start_tmstp:str=repr(time.time()), retention_in_hours=24*30):
        print(f"   uploading {os.path.split(file_name)[1]} to {stream_name} @ {start_tmstp} ({datetime.datetime.fromtimestamp(float(start_tmstp), datetime.timezone.utc).strftime('%Y-%m-%d %H:%M:%S %Z')})")
        try:
            response = self.kinesisvideo.create_stream(StreamName=stream_name, DataRetentionInHours=retention_in_hours)
            print(f"   created stream for {stream_name}")
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
