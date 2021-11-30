# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2021
# SPDX-License-Identifier: Apache-2.0
import sys
import datetime

import boto3
import logging
import time
import uuid
import json
import csv
import argparse

LOGGER = logging.getLogger()
LOGGER.setLevel(logging.INFO)

LOGGER = logging.getLogger()
LOGGER.setLevel(logging.INFO)

class SiteWiseTelemetryImporter:

    def __init__(self, region_name, asset_model_prefix='IotTwinMakerDemo', profile=None, entity_include_pattern=None, verbose_logging=False):
        session = boto3.session.Session(profile)
        self.iotsitewise = session.client('iotsitewise', region_name)
        self.assetModelPrefix = asset_model_prefix
        self.entity_include_pattern = entity_include_pattern
        self.verbose_logging = verbose_logging

    def log(self, message):
        LOGGER.info(message)
        print(message)

    def debug(self, message):
        if self.verbose_logging:
            LOGGER.info(message)
            print(message)

    def get_current_epoch_in_ms(self):
        return int(1000*time.time())

    def min_epoch(self, t1, t2):
        return t1 if t1 < t2 else t2

    def get_data_set(self, csv_file):
        # { 
        #    compType : {   # compData
        #        measureName : { # measureData
        #            entities: {
        #                entityId: [{ time, measure_value } ],
        #            }
        #            measureDataType : {},
        # .          minTime:  #init with current epoch
        #        }
        #    }
        # }

        # compType -> AssetMode
        #     measureName, measureType -> properties: [ { measure_name, measure_type} ] 
        # entityId -> assetId
        # timeseries -> values

        data = {}

        with open(csv_file, 'r') as dataFile:
            csv_reader = csv.reader(dataFile)
            self.log('0:time, 1:comp_type, 2:entity_id, 3:measure_name, 4:measure_value, 5:measure_type')
            i = 0
            for row in csv_reader:

                i += 1

                epochInMs = int(row[0])
                compType = row[1]
                compData = data.get(compType)
                if compData is None:
                    data[compType] = {}
                    compData = data[compType]

                measureName = row[3]
                measureData = compData.get(measureName)
                if measureData is None:
                    compData[measureName] = {
                        'minTime': epochInMs,
                        'measureDataType': row[5],
                        'entities': {}
                    }
                    measureData = compData[measureName]
                    
                measureMinTime = measureData['minTime']
                measureData['minTime'] = self.min_epoch(measureMinTime, epochInMs)

                entities = measureData['entities']
                entityId = row[2]
                entityData = entities.get(entityId)
                if entityData is None:
                    entities[entityId] = []
                    entityData = entities[entityId]
                
                tsData = {
                    'time': epochInMs,
                    'measureValue': row[4]
                }
                entityData.append(tsData)

        self.log(f'lines: {i}')
        return data

    def create_asset_model(self, assetModelName):
        self.log(f'Create assetModel {assetModelName} ...')
        
        assetModels = self.iotsitewise.list_asset_models()
        nextToken = assetModels.get('nextToken')
        for assetModel in assetModels['assetModelSummaries']:
            if assetModel['name'] == assetModelName:
                return self.iotsitewise.describe_asset_model(assetModelId=assetModel['id'])

        while nextToken is not None:
            assetModels = self.iotsitewise.list_asset_models(nextToken = nextToken)
            nextToken = assetModels.get('nextToken') 
            for assetModel in assetModels['assetModelSummaries']: 
                if assetModel['name'] == assetModelName:
                    return self.iotsitewise.describe_asset_model(assetModelId=assetModel['id'])
            
        model = self.iotsitewise.create_asset_model(assetModelName = assetModelName)
        modelId = model['assetModelId']

        modelStatus = model['assetModelStatus']['state']
        while modelStatus != 'ACTIVE':
            time.sleep(1)
            model = self.iotsitewise.describe_asset_model(assetModelId = modelId)
            modelStatus = model['assetModelStatus']['state']

        return model

    def create_asset(self, assetName, assetModelId):
        self.log(f'Create asset {assetName} for model {assetModelId} ...')
        assetlist = self.iotsitewise.list_assets(assetModelId = assetModelId)
        nextToken = assetlist.get('nextToken')
        for asset in assetlist['assetSummaries']:
            if asset['name'] == assetName:
                return self.iotsitewise.describe_asset(assetId = asset['id'])

        while nextToken is not None:
            assetlist = self.iotsitewise.list_assets(assetModelId = assetModelId, nextToken = nextToken)
            nextToken = assetlist.get('nextToken')
            for asset in assetlist['assetSummaries']:
                if asset['name'] == assetName:
                    return self.iotsitewise.describe_asset(assetId = asset['id']) 
        
        assetResult = self.iotsitewise.create_asset(assetName = assetName, assetModelId = assetModelId)
        assetId = assetResult['assetId'] 
        asset = self.iotsitewise.describe_asset(assetId = assetId)
        state = asset['assetStatus']['state']

        while state != 'ACTIVE':
            time.sleep(1)
            asset = self.iotsitewise.describe_asset(assetId = assetId)
            state = asset['assetStatus']['state']

        return asset

    def create_asset_model_property(self, assetModel, propertyName, propertyDataType):
        if propertyDataType == 'VARCHAR':
            propertyDataType = 'STRING'

        self.log(f'Create property {propertyName} with type {propertyDataType} for asset model {assetModel["assetModelName"]}')
        
        properties = assetModel['assetModelProperties']
        for property in properties:
            if property['name'] == propertyName:
                return property
        
        properties.append({
            'name': propertyName,
            'dataType': propertyDataType,
            'type': {
                'measurement': {}
            }
        })

        updateResponse = self.iotsitewise.update_asset_model(
            assetModelId = assetModel['assetModelId'],
            assetModelName = assetModel['assetModelName'],
            assetModelProperties = properties
        )

        assetModelStatus = updateResponse['assetModelStatus']['state']
        
        while assetModelStatus != 'ACTIVE':
            time.sleep(1)
            assetModel = self.iotsitewise.describe_asset_model(assetModelId = assetModel['assetModelId'] )
            assetModelStatus = assetModel['assetModelStatus']['state']

        properties = assetModel['assetModelProperties']
        for property in properties:
            if property['name'] == propertyName:
                return property
            
        return None

    def write_sitewise(self, asset_id, property_id, data_type, entityData, time_delta):
        property_values = []
        
        i = 0
        min_time_ms = sys.maxsize
        max_time_ms = 0
        for tsData in entityData:
            i += 1
            propertyTime = tsData['time'] + time_delta
            value = tsData['measureValue']

            min_time_ms = min(propertyTime, min_time_ms)
            max_time_ms = max(propertyTime, max_time_ms)

            property_value = {

                "timestamp": {
                    "timeInSeconds": int(propertyTime/1000),
                    "offsetInNanos": propertyTime % 1000
                },
                "quality": 'GOOD'
            }

            if 'DOUBLE' == data_type:
                property_value['value'] = {
                    "doubleValue": float(value)
                }
            else:
                property_value['value'] = {
                    "stringValue": value
                }


            property_values.append(property_value)
            
            if i % 10 == 0:
                batch_put_entry = {
                    "assetId": asset_id,
                    "entryId": str(uuid.uuid1()),
                    "propertyId": property_id,
                    "propertyValues": property_values
                }
                property_values = []

                return (self.iotsitewise.batch_put_asset_property_value(entries=[batch_put_entry]), min_time_ms, max_time_ms)

    def import_csv_to_sitewise(self, csv_file):
        assetModelPrefix = self.assetModelPrefix;
        self.log(f'Import {csv_file} to sitewise with model prefix {assetModelPrefix} ...')
        data = self.get_data_set(csv_file)

        populated = False

        for compType, compData in data.items():
            assetModelName = assetModelPrefix + '__' + compType

            assetModelRes = self.create_asset_model(assetModelName)

            min_time_ms = sys.maxsize
            max_time_ms = 0

            for measureName, measureData in compData.items():
                current_epoch = self.get_current_epoch_in_ms()
                measureMinTime = measureData['minTime']
                time_delta = current_epoch - measureMinTime
                measureDataType = measureData['measureDataType']
                
                assetModel = self.iotsitewise.describe_asset_model(assetModelId = assetModelRes['assetModelId'])
                
                measureProperty = self.create_asset_model_property(assetModel, measureName, measureDataType)

                for entityId, entityData in measureData['entities'].items():
                    if self.entity_include_pattern is not None and self.entity_include_pattern in entityId:
                        assetName = assetModelName + '_' + entityId
                        asset = self.create_asset(assetName, assetModel['assetModelId'])
                        self.log(f'...created sitewise asset: {asset["assetArn"]}')
                        (result, _min_time_ms, _max_time_ms) = self.write_sitewise(asset['assetId'], measureProperty['id'], measureDataType, entityData, time_delta)
                        min_time_ms = min(_min_time_ms, min_time_ms)
                        max_time_ms = max(_max_time_ms, max_time_ms)
                        populated = True
                        self.log(f'...imported sitewise data for asset: {asset["assetArn"]}')
                    else:
                        self.debug(f'...skipping asset creation for entity not matching pattern: {entityId}')
        if populated:
            self.log(f'Import to sitewise completed. Data ingested from '
                    f"{datetime.datetime.fromtimestamp(min_time_ms/1000, datetime.timezone.utc).strftime('%Y-%m-%d %H:%M:%S %Z')} - "
                    f"{datetime.datetime.fromtimestamp(max_time_ms/1000, datetime.timezone.utc).strftime('%Y-%m-%d %H:%M:%S %Z')}")

    def get_models(self, assetModelPrefix):
        cleanupModels = []
        def get_models_by_prefix(assetModels, prefix):
            results = []
            for assetModel in assetModels['assetModelSummaries']:
                if assetModel['name'].startswith(prefix):
                    results.append({ 'name': assetModel['name'], 'assetModelId': assetModel['id'] })
            
            return results

        assetModels = self.iotsitewise.list_asset_models()
        nextToken = assetModels.get('nextToken')
        cleanupModels.extend(get_models_by_prefix(assetModels, assetModelPrefix))

        while nextToken is not None:
            assetModels = self.iotsitewise.list_asset_models(nextToken=nextToken)
            nextToken = assetModels.get('nextToken')
            cleanupModels.extend(get_models_by_prefix(assetModels, assetModelPrefix))

        return cleanupModels

    def get_assets_by_model_id(self, modelId):
        cleanupAssets = []

        def get_assets(assets):
            results = []
            for asset in assets["assetSummaries"]:
                results.append( { 'assetId': asset['id'], 'name': asset['name'], 'assetModelId': asset['assetModelId'] })
                
            return results

        assets = self.iotsitewise.list_assets(assetModelId = modelId, maxResults=10)
        nextToken = assets.get('nextToken')
        cleanupAssets.extend(get_assets(assets))

        while nextToken is not None:
            assets = self.iotsitewise.list_assets(assetModelId = modelId, maxResults=10, nextToken = nextToken)
            nextToken = assets.get('nextToken')
            cleanupAssets.extend(get_assets(assets))
            
        return cleanupAssets

    def cleanup_assets_of_model(self, model_id, model_name):
        self.log(f'Cleanup assets of model {model_name} ...')
        cleanupAssets = self.get_assets_by_model_id(model_id)
        for asset in cleanupAssets:
            assetId = asset['assetId']
            self.log(f'delete asset {assetId}...')
            self.iotsitewise.delete_asset(assetId = assetId)

            asset = self.iotsitewise.describe_asset(assetId = assetId)
            state = asset['assetStatus']['state']

            while state is not None:
                time.sleep(1)
                try:
                    asset = self.iotsitewise.describe_asset(assetId = assetId)
                    state = asset['assetStatus']['state']
                except:
                    break
        
        count = len(cleanupAssets)
        self.log(f'{count} assets are deleted for model {model_name}')

    def cleanup_sitewise(self, asset_mode_name_prefix):
        self.log(f'Cleanup sitewise asset models have prefix of {asset_mode_name_prefix} ...')

        cleanupModels = self.get_models(asset_mode_name_prefix)
        for model in cleanupModels:
            model_name = model['name']
            model_id = model['assetModelId']

            self.cleanup_assets_of_model(model_id, model_name)

            self.iotsitewise.delete_asset_model(assetModelId = model_id)

            self.log(f'Cleaned up sitewise asset model {model_name}')

        self.log(f'Cleaned up all asset models with prefix of {asset_mode_name_prefix}')
