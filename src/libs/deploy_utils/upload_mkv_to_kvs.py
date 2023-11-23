# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
# SPDX-License-Identifier: Apache-2.0

import sys
import VideoUtils as vu
from datetime import datetime

'''
e.g. 

  python3 test.mkv testmkv us-east-1 2023-10-17T00:00:00

can use ffmpeg to convert to h264 format:

  ffmpeg -i input.mp4 -c:v libx264 -c:a aac output.mkv
'''

def main():
  print(sys.argv)
  file, stream, region, timestamp = sys.argv[1:]
  datetime_obj = datetime.fromisoformat(timestamp)
  epoch_seconds = datetime_obj.timestamp()
  print("")
  print(f"uploading {file} to {stream} in {region} with producer timestamp {timestamp}...")
  video_utils = vu.VideoUtils(region)
  video_utils.upload_video(file, stream, start_tmstp=str(epoch_seconds), retention_in_hours=24*360)
  print("done")

if __name__ == '__main__':
  main()