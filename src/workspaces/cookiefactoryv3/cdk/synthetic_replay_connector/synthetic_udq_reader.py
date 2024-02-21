# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
# SPDX-License-Identifier: Apache-2.0

from udq_utils.udq import SingleEntityReader, MultiEntityReader, IoTTwinMakerDataRow, IoTTwinMakerUdqResponse
from udq_utils.udq_models import IoTTwinMakerUDQEntityRequest, IoTTwinMakerUDQComponentTypeRequest, OrderBy, IoTTwinMakerReference, \
    EntityComponentPropertyRef
from datetime import datetime, timedelta
import json
import pandas as pd
import os
import boto3
from botocore.config import Config

session = boto3.session.Session()
session_config = Config(
    user_agent="cookiefactory_v3/1.0.0"
)
iottm = session.client(service_name='iottwinmaker', config=session_config)

# for debugging
pd.set_option('display.max_rows', 500)
pd.set_option('display.max_columns', 500)
pd.set_option('display.width', 1000)

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

# csv handling
df2_rateeq = pd.read_csv('data.csv')
df2_rateeq = df2_rateeq.pivot(index=['timestamp', 'asset_name'], columns='attribute_name', values='attribute_value')
df2_rateeq = df2_rateeq.reset_index()
# re-mapping of entity names to entity_ids for CookieLine1 telemetry data
rateeq_to_entityId = {
    "Box Erector": "BOX_ERECTOR_142496af-df2e-490e-aed5-2580eaf75e40",
    "Box Sealer": "BOX_SEALER_ad434a34-4363-4a36-8153-20bd7189951d",
    "Conveyor Left Turn": "CONVEYOR_LEFT_TURN_b28f2ca9-b6a7-44cd-a62d-7f76fc17ba45",
    "Conveyor Right Turn": "CONVEYOR_RIGHT_TURN_c4f2df3d-26a2-45c5-a6c9-02ca00eb4af6",
    "Cookie Former": "COOKIE_FORMER_19556bfd-469c-40bc-a389-dbeab255c144",
    "Cookie Inspector": "INSPECTOR_POST_FREEZER_TUNNEL_999d8796-55f1-4791-af53-fc210038686f",
    "Freezer Tunnel": "FREEZER_TUNNEL_e12e0733-f5df-4604-8f10-417f49e6d298",
    "Labeller": "LABELING_BELT_5f98ffd2-ced1-48dd-a111-e3503b4e8532",
    "Line 1": "COOKIE_LINE_5ce9f1d5-61b0-433f-a850-53fa7ca27aa1",
    "Liner Inserter": "PLASTIC_LINER_a77e76bc-53f3-420d-8b2f-76103c810fac",
    "Vertical Conveyor": "VERTICAL_CONVEYOR_d5423f7f-379c-4a97-aae0-3a5c0bcc9116",
}
def remap_rateeq_ids(row):
    return rateeq_to_entityId[row['asset_name']]
df2_rateeq['entityId'] = df2_rateeq.apply(remap_rateeq_ids, axis=1)
df2_rateeq['_entityId'] = df2_rateeq['entityId']
df2_rateeq['Time'] = pd.to_datetime(df2_rateeq['timestamp'], unit='s').astype(str)

# interpolate periods with no values with last value carried forward for the same entityId
# for propName in ['Alarm_State', 'Alarm_Text', 'Bad', 'Bad_Parts_1Min', 'Blocked', 'Blocked_Time_1Min', 'Down', 'Down_Time_1Min', 'Good', 'Good_Parts_1Min', 'Max_Level', 'Min_Level', 'Moisture', 'Shift', 'Speed', 'Starved', 'Starved_Time_1Min', 'State', 'Temperature', 'Total', 'Total_Parts_1Min']:
#     df2_rateeq[propName] = df2_rateeq.groupby('entityId')[propName].apply(lambda x: x.ffill().bfill())
df2_rateeq = df2_rateeq.set_index('_entityId')
df2_rateeq = df2_rateeq.ffill()
df2_rateeq = df2_rateeq.bfill()



df2_rateeq_err = pd.read_csv('error_data.csv')
df2_rateeq_err = df2_rateeq_err.pivot(index=['timestamp', 'asset_name'], columns='attribute_name', values='attribute_value')
df2_rateeq_err = df2_rateeq_err.reset_index()
# re-mapping of entity names to entity_ids for CookieLine1 telemetry data
def remap_rateeq_ids(row):
    return rateeq_to_entityId[row['asset_name']]
df2_rateeq_err['entityId'] = df2_rateeq_err.apply(remap_rateeq_ids, axis=1)
df2_rateeq_err['_entityId'] = df2_rateeq_err['entityId']
df2_rateeq_err['Time'] = pd.to_datetime(df2_rateeq_err['timestamp'], unit='s').astype(str)

# interpolate periods with no values with last value carried forward for the same entityId
# for propName in ['Alarm_State', 'Alarm_Text', 'Bad', 'Bad_Parts_1Min', 'Blocked', 'Blocked_Time_1Min', 'Down', 'Down_Time_1Min', 'Good', 'Good_Parts_1Min', 'Max_Level', 'Min_Level', 'Moisture', 'Shift', 'Speed', 'Starved', 'Starved_Time_1Min', 'State', 'Temperature', 'Total', 'Total_Parts_1Min']:
#     df2_rateeq_err[propName] = df2_rateeq_err.groupby('entityId')[propName].apply(lambda x: x.ffill().bfill())
df2_rateeq_err = df2_rateeq_err.set_index('_entityId')
df2_rateeq_err = df2_rateeq_err.ffill()
df2_rateeq_err = df2_rateeq_err.bfill()


class RenderIoTTwinMakerDataRow(IoTTwinMakerDataRow):

    def __init__(self, dt, value, property_name, component_name, entity_id):
        self.dt = dt
        self.value = value
        self.property_name = property_name
        self.component_name = component_name
        self.entity_id = entity_id
        pass

    def get_iottwinmaker_reference(self) -> IoTTwinMakerReference:
        # Note: this synthetic data generator is currently specific to CookieLine
        return IoTTwinMakerReference(ecp=EntityComponentPropertyRef(
            entity_id=self.entity_id,
            component_name=self.component_name,
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
            if request.component_name == 'rateEquipment':
                try:
                    workspace = request.udq_context['workspace_id']
                    return_errors = iottm.get_entity(workspaceId=workspace, entityId='Equipment_5c9e83d2-1880-4f83-affd-9a27f80d39f7')['components']['synthetics']['properties']['generate_error_states']['value']['booleanValue']
                    if return_errors:
                        df2 = df2_rateeq_err.copy()
                    else:
                        df2 = df2_rateeq.copy()
                except Error as e:
                    print(e)
                    df2 = df2_rateeq.copy()
                data_interval = 5
            else:
                df2 = df.copy()
                data_interval = DATA_INTERVAL
            df2.reset_index()

            '''e.g.
                00 = {dict: 1} {'Speed': 6}
                01 = {dict: 1} {'Speed': 10}
                02 = {dict: 1} {'Speed': 3}
            '''
            data_index = df2[df2['entityId'] == request.entity_id][[selected_property, 'Time']].set_index('Time').to_dict('records')

            # determine the relative start point in the data set to generate synthetic data for, as well as number of data points to return
            epoch_start_in_seconds = start_dt.timestamp()
            sample_time_range_length_in_seconds = (len(data_index) * (data_interval))
            start_interval_bin = epoch_start_in_seconds % sample_time_range_length_in_seconds
            start_interval_bin_in_index = int(start_interval_bin / (data_interval))
            number_of_datapoints = min(max_rows, int((end_dt.timestamp() - start_dt.timestamp()) / (data_interval)))

            # generate data response by repeatedly iterating over the data sample
            curr_dt = datetime.fromtimestamp(int(start_dt.timestamp() / (data_interval)) * (data_interval))
            curr_index = start_interval_bin_in_index
            for i in range(number_of_datapoints):
                dt = curr_dt
                value = data_index[curr_index][selected_property]

                data_rows.append(RenderIoTTwinMakerDataRow(dt, value, selected_property, request.component_name, request.entity_id))

                curr_dt = dt + timedelta(seconds=data_interval)
                curr_index = (curr_index + 1) % len(data_index)

        return data_rows

RENDER_READER = RenderValuesReader()

# Main Lambda invocation entry point
# noinspection PyUnusedLocal
def lambda_handler(event, context):
    print(f'Event: {event}', )
    result = RENDER_READER.process_query(event)
    print("result:")
    print(result)
    return result

# contains sample test event from a previous UDQ Lambda execution
# used for local testing, not executed by Lambda when deployed
if __name__ == '__main__':
    test_workspace_id = "__FILL_IN__"
    test_event = {'workspaceId': test_workspace_id, 'selectedProperties': ['Bad_Parts_1Min'], 'startDateTime': 1700268750, 'startTime': '2023-11-18T00:52:30.000Z', 'endDateTime': 1700268780, 'endTime': '2023-11-18T00:53:00.000Z', 'properties': {'Starved': {'definition': {'dataType': {'type': 'BOOLEAN'}, 'isTimeSeries': True, 'isRequiredInEntity': False, 'isExternalId': False, 'isStoredExternally': True, 'isImported': False, 'isFinal': False, 'isInherited': False, 'imported': False, 'requiredInEntity': False, 'externalId': False, 'storedExternally': True, 'timeSeries': True, 'inherited': False, 'final': False}}, 'Down': {'definition': {'dataType': {'type': 'BOOLEAN'}, 'isTimeSeries': True, 'isRequiredInEntity': False, 'isExternalId': False, 'isStoredExternally': True, 'isImported': False, 'isFinal': False, 'isInherited': False, 'imported': False, 'requiredInEntity': False, 'externalId': False, 'storedExternally': True, 'timeSeries': True, 'inherited': False, 'final': False}}, 'Down_Time_1Min': {'definition': {'dataType': {'type': 'DOUBLE'}, 'isTimeSeries': True, 'isRequiredInEntity': False, 'isExternalId': False, 'isStoredExternally': True, 'isImported': False, 'isFinal': False, 'isInherited': False, 'imported': False, 'requiredInEntity': False, 'externalId': False, 'storedExternally': True, 'timeSeries': True, 'inherited': False, 'final': False}}, 'Good_Parts_1Min': {'definition': {'dataType': {'type': 'DOUBLE'}, 'isTimeSeries': True, 'isRequiredInEntity': False, 'isExternalId': False, 'isStoredExternally': True, 'isImported': False, 'isFinal': False, 'isInherited': False, 'imported': False, 'requiredInEntity': False, 'externalId': False, 'storedExternally': True, 'timeSeries': True, 'inherited': False, 'final': False}}, 'Alarm_Text': {'definition': {'dataType': {'type': 'STRING'}, 'isTimeSeries': True, 'isRequiredInEntity': False, 'isExternalId': False, 'isStoredExternally': True, 'isImported': False, 'isFinal': False, 'isInherited': False, 'imported': False, 'requiredInEntity': False, 'externalId': False, 'storedExternally': True, 'timeSeries': True, 'inherited': False, 'final': False}}, 'Bad': {'definition': {'dataType': {'type': 'INTEGER'}, 'isTimeSeries': True, 'isRequiredInEntity': False, 'isExternalId': False, 'isStoredExternally': True, 'isImported': False, 'isFinal': False, 'isInherited': False, 'imported': False, 'requiredInEntity': False, 'externalId': False, 'storedExternally': True, 'timeSeries': True, 'inherited': False, 'final': False}}, 'Total_Parts_1Min': {'definition': {'dataType': {'type': 'DOUBLE'}, 'isTimeSeries': True, 'isRequiredInEntity': False, 'isExternalId': False, 'isStoredExternally': True, 'isImported': False, 'isFinal': False, 'isInherited': False, 'imported': False, 'requiredInEntity': False, 'externalId': False, 'storedExternally': True, 'timeSeries': True, 'inherited': False, 'final': False}}, 'Downtime_Limit_Seconds': {'definition': {'dataType': {'type': 'INTEGER'}, 'isTimeSeries': True, 'isRequiredInEntity': False, 'isExternalId': False, 'isStoredExternally': True, 'isImported': False, 'isFinal': False, 'isInherited': False, 'imported': False, 'requiredInEntity': False, 'externalId': False, 'storedExternally': True, 'timeSeries': True, 'inherited': False, 'final': False}}, 'Alarm_State': {'definition': {'dataType': {'type': 'STRING'}, 'isTimeSeries': True, 'isRequiredInEntity': False, 'isExternalId': False, 'isStoredExternally': True, 'isImported': False, 'isFinal': False, 'isInherited': False, 'imported': False, 'requiredInEntity': False, 'externalId': False, 'storedExternally': True, 'timeSeries': True, 'inherited': False, 'final': False}}, 'Blocked_Time_1Min': {'definition': {'dataType': {'type': 'DOUBLE'}, 'isTimeSeries': True, 'isRequiredInEntity': False, 'isExternalId': False, 'isStoredExternally': True, 'isImported': False, 'isFinal': False, 'isInherited': False, 'imported': False, 'requiredInEntity': False, 'externalId': False, 'storedExternally': True, 'timeSeries': True, 'inherited': False, 'final': False}}, 'Starved_Time_1Min': {'definition': {'dataType': {'type': 'DOUBLE'}, 'isTimeSeries': True, 'isRequiredInEntity': False, 'isExternalId': False, 'isStoredExternally': True, 'isImported': False, 'isFinal': False, 'isInherited': False, 'imported': False, 'requiredInEntity': False, 'externalId': False, 'storedExternally': True, 'timeSeries': True, 'inherited': False, 'final': False}}, 'Reject_Limit': {'definition': {'dataType': {'type': 'INTEGER'}, 'isTimeSeries': True, 'isRequiredInEntity': False, 'isExternalId': False, 'isStoredExternally': True, 'isImported': False, 'isFinal': False, 'isInherited': False, 'imported': False, 'requiredInEntity': False, 'externalId': False, 'storedExternally': True, 'timeSeries': True, 'inherited': False, 'final': False}}, 'State': {'definition': {'dataType': {'type': 'STRING'}, 'isTimeSeries': True, 'isRequiredInEntity': False, 'isExternalId': False, 'isStoredExternally': True, 'isImported': False, 'isFinal': False, 'isInherited': False, 'imported': False, 'requiredInEntity': False, 'externalId': False, 'storedExternally': True, 'timeSeries': True, 'inherited': False, 'final': False}}, 'Total': {'definition': {'dataType': {'type': 'INTEGER'}, 'isTimeSeries': True, 'isRequiredInEntity': False, 'isExternalId': False, 'isStoredExternally': True, 'isImported': False, 'isFinal': False, 'isInherited': False, 'imported': False, 'requiredInEntity': False, 'externalId': False, 'storedExternally': True, 'timeSeries': True, 'inherited': False, 'final': False}}, 'Bad_Parts_1Min': {'definition': {'dataType': {'type': 'DOUBLE'}, 'isTimeSeries': True, 'isRequiredInEntity': False, 'isExternalId': False, 'isStoredExternally': True, 'isImported': False, 'isFinal': False, 'isInherited': False, 'imported': False, 'requiredInEntity': False, 'externalId': False, 'storedExternally': True, 'timeSeries': True, 'inherited': False, 'final': False}}, 'Good': {'definition': {'dataType': {'type': 'INTEGER'}, 'isTimeSeries': True, 'isRequiredInEntity': False, 'isExternalId': False, 'isStoredExternally': True, 'isImported': False, 'isFinal': False, 'isInherited': False, 'imported': False, 'requiredInEntity': False, 'externalId': False, 'storedExternally': True, 'timeSeries': True, 'inherited': False, 'final': False}}, 'Blocked': {'definition': {'dataType': {'type': 'BOOLEAN'}, 'isTimeSeries': True, 'isRequiredInEntity': False, 'isExternalId': False, 'isStoredExternally': True, 'isImported': False, 'isFinal': False, 'isInherited': False, 'imported': False, 'requiredInEntity': False, 'externalId': False, 'storedExternally': True, 'timeSeries': True, 'inherited': False, 'final': False}}}, 'entityId': 'INSPECTOR_POST_FREEZER_TUNNEL_999d8796-55f1-4791-af53-fc210038686f', 'componentName': 'rateEquipment', 'maxResults': 1, 'orderByTime': 'DESCENDING'}
    lambda_handler(test_event, None)