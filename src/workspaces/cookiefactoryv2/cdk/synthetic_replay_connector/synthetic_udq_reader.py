# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
# SPDX-License-Identifier: Apache-2.0

from udq_utils.udq import SingleEntityReader, MultiEntityReader, IoTTwinMakerDataRow, IoTTwinMakerUdqResponse
from udq_utils.udq_models import IoTTwinMakerUDQEntityRequest, IoTTwinMakerUDQComponentTypeRequest, OrderBy, IoTTwinMakerReference, \
    EntityComponentPropertyRef
from datetime import datetime, timedelta
import json
import pandas as pd
import os

# for debugging
# pd.set_option('display.max_rows', 500)
# pd.set_option('display.max_columns', 500)
# pd.set_option('display.width', 1000)

# read the telemetry data interval
DATA_INTERVAL = 10
try:
    DATA_INTERVAL = int(os.environ['TELEMETRY_DATA_TIME_INTERVAL_SECONDS'])
except:
    pass # use default interval

# read the telemetry data sample into a pandas dataframe for serving queries
data = []

try:
   telemetryDataFileName = os.environ['TELEMETRY_DATA_FILE_NAME']
   if telemetryDataFileName is None or telemetryDataFileName.strip() == '':
       telemetryDataFileName = 'demoTelemetryData.json'
   print(f"telemetryDataFileName: {telemetryDataFileName}")
   with open(telemetryDataFileName, 'r') as f:
       lines = f.readlines()
       for line in lines:
           data.append(json.loads(line.strip()))
except:
   with open('demoTelemetryData.json', 'r') as f:
       lines = f.readlines()
       for line in lines:
           data.append(json.loads(line.strip()))

df = pd.DataFrame(data)

# sample data cleaning operations for the csv data

# re-mapping of entity names to entity_ids for CookieLine1 telemetry data
simulatorName_to_entityId = {
    "plasticLiner": "PLASTIC_LINER_a77e76bc-53f3-420d-8b2f-76103c810fac",
    "boxErector": "BOX_ERECTOR_142496af-df2e-490e-aed5-2580eaf75e40",
    "labelingBelt": "LABELING_BELT_5f98ffd2-ced1-48dd-a111-e3503b4e8532",
    "freezingTunnel": "FREEZER_TUNNEL_e12e0733-f5df-4604-8f10-417f49e6d298",
    "boxSealer": "BOX_SEALER_ad434a34-4363-4a36-8153-20bd7189951d",
    "cookieFormer": "COOKIE_FORMER_19556bfd-469c-40bc-a389-dbeab255c144",
    "conveyorRight": "CONVEYOR_RIGHT_TURN_c4f2df3d-26a2-45c5-a6c9-02ca00eb4af6",
    "verticalConveyor": "VERTICAL_CONVEYOR_d5423f7f-379c-4a97-aae0-3a5c0bcc9116",
    "conveyorLeft": "CONVEYOR_LEFT_TURN_b28f2ca9-b6a7-44cd-a62d-7f76fc17ba45",
    "conveyorStraight": "CONVEYOR_STRIGHT_9c62c546-f8ef-489d-9938-d46a12c97f32",
}
def remap_ids(row):
    return simulatorName_to_entityId[row['Name']]

df['entityId'] = df.apply(remap_ids, axis=1)

# re-map alarm status values to match IoT TwinMaker's com.amazon.iottwinmaker.alarm.basic component type
def remap_alarm_status(row):
    if row['Alarming']:
        return 'ACTIVE'
    else:
        return 'NORMAL'

df['alarm_status'] = df.apply(remap_alarm_status, axis=1)
df['AlarmMessage'] = df["Alarm Message"] # Note: no spaces allowed in property names


class RenderIoTTwinMakerDataRow(IoTTwinMakerDataRow):

    def __init__(self, dt, value, property_name, entity_id):
        self.dt = dt
        self.value = value
        self.property_name = property_name
        self.entity_id = entity_id
        pass

    def get_iottwinmaker_reference(self) -> IoTTwinMakerReference:
        # Note: this synthetic data generator is currently specific to CookieLine
        return IoTTwinMakerReference(ecp=EntityComponentPropertyRef(
            entity_id=self.entity_id,
            component_name='CookieLineComponent',
            property_name=self.property_name
        ))

    def get_iso8601_timestamp(self) -> str:
        return self.dt.strftime('%Y-%m-%dT%H:%M:%S.%fZ')

    def get_value(self):
        return self.value

class RenderValuesReader(SingleEntityReader, MultiEntityReader):
    def __init__(self):
        pass

    def entity_query(self, request: IoTTwinMakerUDQEntityRequest) -> IoTTwinMakerUdqResponse:
        return IoTTwinMakerUdqResponse(rows=self._get_data_rows(request))

    def component_type_query(self, request: IoTTwinMakerUDQComponentTypeRequest) -> IoTTwinMakerUdqResponse:
        # Note: this synthetic data generator currently only supports single-entity queries
        #       alarm data will not appear in scenes from GetAlarms query
        return IoTTwinMakerUdqResponse([], None)

    def _get_data_rows(self, request):
        start_dt = request.start_datetime
        end_dt = request.end_datetime
        max_rows = request.max_rows

        data_rows = []

        for selected_property in request.selected_properties:
            df2 = df.copy()
            df2.reset_index()

            '''e.g.
                00 = {dict: 1} {'Speed': 6}
                01 = {dict: 1} {'Speed': 10}
                02 = {dict: 1} {'Speed': 3}
            '''
            data_index = df2[df2['entityId'] == request.entity_id][[selected_property, 'Time']].set_index('Time').to_dict('records')

            # determine the relative start point in the data set to generate synthetic data for, as well as number of data points to return
            epoch_start_in_seconds = start_dt.timestamp()
            sample_time_range_length_in_seconds = (len(data_index) * (DATA_INTERVAL))
            start_interval_bin = epoch_start_in_seconds % sample_time_range_length_in_seconds
            start_interval_bin_in_index = int(start_interval_bin / (DATA_INTERVAL))
            number_of_datapoints = min(max_rows, int((end_dt.timestamp() - start_dt.timestamp()) / (DATA_INTERVAL)))

            # generate data response by repeatedly iterating over the data sample
            curr_dt = datetime.fromtimestamp(int(start_dt.timestamp() / (DATA_INTERVAL)) * (DATA_INTERVAL))
            curr_index = start_interval_bin_in_index
            for i in range(number_of_datapoints):
                dt = curr_dt
                value = data_index[curr_index][selected_property]

                data_rows.append(RenderIoTTwinMakerDataRow(dt, value, selected_property, request.entity_id))

                curr_dt = dt + timedelta(seconds=DATA_INTERVAL)
                curr_index = (curr_index + 1) % len(data_index)

        return data_rows

RENDER_READER = RenderValuesReader()

# Main Lambda invocation entry point
# noinspection PyUnusedLocal
def lambda_handler(event, context):
    print('Event: %s', event)
    result = RENDER_READER.process_query(event)
    print("result:")
    print(result)
    return result

# contains sample test event from a previous UDQ Lambda execution
# used for local testing, not executed by Lambda when deployed
if __name__ == '__main__':
    test_workspace_id = "__FILL_IN__"
    test_event = {'workspaceId': test_workspace_id, 'selectedProperties': ['Resources'], 'startDateTime': 1679465064, 'startTime': '2023-03-22T06:04:24Z', 'endDateTime': 1679551464, 'endTime': '2023-03-23T06:04:24Z', 'properties': {'AlarmMessage': {'definition': {'dataType': {'type': 'STRING'}, 'isTimeSeries': True, 'isRequiredInEntity': False, 'isExternalId': False, 'isStoredExternally': True, 'isImported': False, 'isFinal': False, 'isInherited': False, 'requiredInEntity': False, 'imported': False, 'externalId': False, 'storedExternally': True, 'timeSeries': True, 'inherited': False, 'final': False}}, 'Speed': {'definition': {'dataType': {'type': 'DOUBLE'}, 'isTimeSeries': True, 'isRequiredInEntity': False, 'isExternalId': False, 'isStoredExternally': True, 'isImported': False, 'isFinal': False, 'isInherited': False, 'requiredInEntity': False, 'imported': False, 'externalId': False, 'storedExternally': True, 'timeSeries': True, 'inherited': False, 'final': False}}, 'Temperature': {'definition': {'dataType': {'type': 'DOUBLE'}, 'isTimeSeries': True, 'isRequiredInEntity': False, 'isExternalId': False, 'isStoredExternally': True, 'isImported': False, 'isFinal': False, 'isInherited': False, 'requiredInEntity': False, 'imported': False, 'externalId': False, 'storedExternally': True, 'timeSeries': True, 'inherited': False, 'final': False}}, 'alarm_status': {'definition': {'dataType': {'type': 'STRING', 'allowedValues': [{'stringValue': 'ACTIVE'}, {'stringValue': 'SNOOZE_DISABLED'}, {'stringValue': 'ACKNOWLEDGED'}, {'stringValue': 'NORMAL'}]}, 'isTimeSeries': True, 'isRequiredInEntity': False, 'isExternalId': False, 'isStoredExternally': True, 'isImported': False, 'isFinal': False, 'isInherited': True, 'requiredInEntity': False, 'imported': False, 'externalId': False, 'storedExternally': True, 'timeSeries': True, 'inherited': True, 'final': False}}, 'Resources': {'definition': {'dataType': {'type': 'MAP', 'nestedType': {'type': 'DOUBLE'}}, 'isTimeSeries': True, 'isRequiredInEntity': False, 'isExternalId': False, 'isStoredExternally': True, 'isImported': False, 'isFinal': False, 'isInherited': False, 'requiredInEntity': False, 'imported': False, 'externalId': False, 'storedExternally': True, 'timeSeries': True, 'inherited': False, 'final': False}}, 'telemetryAssetId': {'definition': {'dataType': {'type': 'STRING'}, 'isTimeSeries': False, 'isRequiredInEntity': True, 'isExternalId': True, 'isStoredExternally': False, 'isImported': False, 'isFinal': False, 'isInherited': True, 'requiredInEntity': True, 'imported': False, 'externalId': True, 'storedExternally': False, 'timeSeries': False, 'inherited': True, 'final': False}, 'value': {'stringValue': 'PLASTIC_LINER_23df2a72-30d6-4f8f-bc15-95a8e945b4fa'}}, 'telemetryAssetType': {'definition': {'dataType': {'type': 'STRING'}, 'isTimeSeries': False, 'isRequiredInEntity': True, 'isExternalId': False, 'isStoredExternally': False, 'isImported': False, 'isFinal': False, 'isInherited': True, 'defaultValue': {'stringValue': 'CookieLine'}, 'requiredInEntity': True, 'imported': False, 'externalId': False, 'storedExternally': False, 'timeSeries': False, 'inherited': True, 'final': False}, 'value': {'stringValue': 'CookieLine'}}, 'alarm_key': {'definition': {'dataType': {'type': 'STRING'}, 'isTimeSeries': False, 'isRequiredInEntity': True, 'isExternalId': True, 'isStoredExternally': False, 'isImported': False, 'isFinal': False, 'isInherited': True, 'requiredInEntity': True, 'imported': False, 'externalId': True, 'storedExternally': False, 'timeSeries': False, 'inherited': True, 'final': False}, 'value': {'stringValue': 'PLASTIC_LINER_23df2a72-30d6-4f8f-bc15-95a8e945b4fa'}}}, 'entityId': 'PLASTIC_LINER_a77e76bc-53f3-420d-8b2f-76103c810fac', 'componentName': 'CookieLineComponent', 'maxResults': 100, 'orderByTime': 'ASCENDING'}
    lambda_handler(test_event, None)