# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2021
# SPDX-License-Identifier: Apache-2.0

import json
from abc import ABC
from datetime import datetime
from enum import Enum
from typing import List

class EntityComponentPropertyRef():
    """
    Represents an entity-component-property reference that uniquely identifies an AWS IoT TwinMaker property
    Consists of an entityId, componentName, and propertyName
    """

    def __init__(self, entity_id: str, component_name: str, property_name: str):
        self.entity_id = entity_id
        self.component_name = component_name
        self.property_name = property_name

    def __hash__(self):
        return hash((self.entity_id, self.component_name, self.property_name))

    def __eq__(self, other):
        return (self.entity_id, self.component_name, self.property_name) == (other.entity_id, other.component_name, other.property_name)

class ExternalIdPropertyRef():
    """
    Represents an externalIdProperty reference that uniquely identifies an AWS IoT TwinMaker property across entities
    Consists of a key-value map externalIdProperty and propertyName
    """

    def __init__(self, external_id_property: dict, property_name: str):
        self.external_id_property = external_id_property
        self.property_name = property_name

    def __hash__(self):
        return hash((json.dumps(self.external_id_property), self.property_name))

    def __eq__(self, other):
        return (self.external_id_property, self.property_name) == (other.external_id_property, other.property_name)

class IoTTwinMakerReference():
    """
    Represents a unique reference to a property in AWS IoT TwinMaker
    May include an EntityComponentPropertyRef or an ExternalIdPropertyRef
    """

    def __init__(self, ecp: EntityComponentPropertyRef = None, eip: ExternalIdPropertyRef = None):
        self.ecp = ecp
        self.eip = eip

    def __hash__(self):
        return hash((self.ecp, self.eip))

    def __eq__(self, other):
        return (self.ecp, self.eip) == (other.ecp, other.eip)

    def serialize(self):
        ret = {}
        if self.ecp:
            ret['entityId'] = self.ecp.entity_id
            ret['componentName'] = self.ecp.component_name
            ret['propertyName'] = self.ecp.property_name
        if self.eip:
            ret['externalIdProperty'] = self.eip.external_id_property
            ret['propertyName'] = self.eip.property_name
        return ret




class IoTTwinMakerUnifiedDataQuery(ABC):
    """
    main entry point to UDQ wrapper, handles request/response unmarshalling/marshalling
    delegates to the connector author's Reader implementation to retrieve data rows from their data source
    delegates to the connector author's DataRow implementation to extract necessary fields for response construction
    """

    def process_query(self, lambda_event):
        from udq_utils.udq import SingleEntityReader, MultiEntityReader

        # parse the raw lambda event into a structured IoTTwinMakerUdqRequest request object
        request = IoTTwinMakerUdqRequest.parse(lambda_event)

        # invoke the approriate entity reader function based on the request, or throw error if not supported
        if (isinstance(request, IoTTwinMakerUDQEntityRequest)):
            if isinstance(self, SingleEntityReader):
                udq_response = self.entity_query(request)
            else:
                raise NotImplementedError(f"Received entity request but this processor ({self.__class__.__name__}) doesn't support it")
        elif (isinstance(request, IoTTwinMakerUDQComponentTypeRequest)):
            if isinstance(self, MultiEntityReader):
                udq_response = self.component_type_query(request)
            else:
                raise NotImplementedError(f"Received component type request but this processor ({self.__class__.__name__}) doesn't support it")
        else:
            raise NotImplementedError(f"Received unknown UDQ request type: {lambda_event}")

        # inline helper to marshall python native types into common IoT TwinMaker types
        def serialize_value(val):
            if type(val) is str:
                return {
                    'stringValue': val
                }
            elif type(val) is float:
                return {
                    'doubleValue': str(val) # Note: the UDQ interface expects string value returns instead of JSON-native types
                }
            elif type(val) is bool:
                return {
                    'booleanValue': str(val)
                }
            else:
                assert False

        # marshall data rows into property values grouped by entityPropertyReference
        entity_prop_ref_to_values = {}
        for row in udq_response.rows:
            ref = row.get_iottwinmaker_reference()
            if ref not in entity_prop_ref_to_values:
                entity_prop_ref_to_values[ref] = []
            ts = row.get_iso8601_timestamp()
            if ts is None:
                ts = row.get_timestamp().strftime('%Y-%m-%dT%H:%M:%S.000Z')
            entity_prop_ref_to_values[ref].append({
                'time': ts,
                'value': serialize_value(row.get_value())
            })

        # marshall the entity_prop_ref_to_values into response propertyValues structure
        property_values = []
        for ref in entity_prop_ref_to_values:
            property_values.append({
                'entityPropertyReference': ref.serialize(),
                'values': entity_prop_ref_to_values[ref]
            })

        # marshall propertyValues and nextToken into final UDQ response
        return {
            'propertyValues': property_values,
            'nextToken': udq_response.next_token if udq_response.next_token else None
        }

class OrderBy(Enum):
    ASCENDING = 1
    DESCENDING = 2

class IoTTwinMakerUdqRequest():
    """
    Models a UDQ request
    Check fields annotated with @property
    """

    @staticmethod
    def get_required_field(dict, key):
        if key not in dict:
            raise Exception("Required key[{}] is missing".format(key))
        else:
            return dict[key]

    @staticmethod
    def validate_timestamp(seconds_since_epoch):
        try:
            datetime.utcfromtimestamp(seconds_since_epoch).isoformat()
        except:
            raise Exception("Timestamp[{}] could not be converted to IS8601".format(seconds_since_epoch))

    def __init__(self, event):
        self._event = event

        self._udq_context = {
            'workspace_id': IoTTwinMakerUdqRequest.get_required_field(event, 'workspaceId'),
            'properties': self._event['properties']
        }

        self._entityId = event.get('entityId')
        self._componentName = event.get('componentName')
        # entityId and componentName must both appear if at all
        if (self._entityId and not self._componentName) or (not self._entityId and self._componentName):
            raise Exception("EntityId and componentName must show up together")

        self._componentTypeId = event.get('componentTypeId')

        self._selectedProperties = IoTTwinMakerUdqRequest.get_required_field(event, 'selectedProperties')

        # validate the selected properties
        # verify each selected property is in the properties map from the event
        allowed_props = self._udq_context['properties'].keys()
        if(len(self._selectedProperties) < 1):
            raise Exception('Unexpected selectedProperties[{}]'.format(self._selectedProperties))
        for selectedProperty in self._selectedProperties:
            # Note: component definition only provided from TwinMaker for single-entity requests
            if self._componentTypeId is None and selectedProperty not in allowed_props:
                raise Exception(f"selectedProperty: {selectedProperty} not found in entity/component definition. Allowed properties: {allowed_props}")

        # deprecated: only used while startDateTime/endDateTime not yet replaced with startTime/endTime
        def get_optional_datetime_field(event, field_name):
            time_in_sec = IoTTwinMakerUdqRequest.get_required_field(event, field_name)
            try:
                return datetime.utcfromtimestamp(time_in_sec)
            except:
                return None

        # optional since these fields are being replaced with startTime / endTime for better time precision
        self._startDateTime = get_optional_datetime_field(self._event, 'startDateTime')
        self._endDateTime = get_optional_datetime_field(self._event, 'endDateTime')

        self._startTime = IoTTwinMakerUdqRequest.get_required_field(self._event, 'startTime')
        self._endTime = IoTTwinMakerUdqRequest.get_required_field(self._event, 'endTime')

        self._nextToken = event.get('nextToken')
        self._maxRows = event.get('maxResults')

        def get_order_by(event):
            orderByTime = event.get('orderByTime')
            if not orderByTime or orderByTime == 'ASCENDING':
                return OrderBy.ASCENDING
            elif orderByTime == 'DESCENDING':
                return OrderBy.DESCENDING
            else:
                raise Exception(f"Unsupported OrderBy type: [{orderByTime}]")
        self._orderBy = get_order_by(self._event)

        self._property_filters = self._event.get('propertyFilters', [])

    @property
    def udq_context(self):
        """
        Additional context information provided by IoT TwinMaker. Such as the workspace of this request and the property context
        for the entity/component type we are querying (if present)
        """
        return self._udq_context

    @property
    def entity_id(self) -> str:
        """
        The IoT TwinMaker id for the entity we are querying on
        """
        return self._entityId

    @property
    def component_name(self) -> str:
        """
        The name of the component in the entity model we are querying on
        """
        return self._componentName

    @property
    def component_type_id(self) -> str:
        """
        The component type id we are querying on
        """
        return self._componentTypeId

    @property
    def selected_properties(self) -> List[str]:
        """
        The component properties to retrieve
        """
        return self._selectedProperties

    # deprecated, used start_time instead, which supports higher precision
    @property
    def start_datetime(self) -> datetime:
        """
        The exclusive start time of the query
        """
        return self._startDateTime

    # deprecated, used end_time instead, which supports higher precision
    @property
    def end_datetime(self) -> datetime:
        """
        The inclusive end time of the query
        """
        return self._endDateTime

    @property
    def start_time(self) -> str:
        """
        The exclusive start time of the query as ISO8601 basic string
        """
        return self._startTime

    @property
    def end_time(self) -> str:
        """
        The inclusive end time of the query as ISO8601 basic string
        """
        return self._endTime

    @property
    def next_token(self) -> str:
        """
        For paginated requests, the previously returned pagination token to resume the query cursor location
        """
        return self._nextToken

    @property
    def max_rows(self) -> int:
        """
        Maximum number of rows to return
        """
        return self._maxRows

    @property
    def order_by(self) -> OrderBy:
        """
        Order by direction for result timestamps
        """
        return self._orderBy

    @property
    def property_filters(self):
        """
        Property filters to apply to the results
        """
        return self._property_filters


    @staticmethod
    def parse(event):
        if 'entityId' in event:
            return IoTTwinMakerUDQEntityRequest(event)
        else:
            return IoTTwinMakerUDQComponentTypeRequest(event)


class IoTTwinMakerUDQEntityRequest(IoTTwinMakerUdqRequest):
    """
    Models an entity-level request (currently more of a placeholder for specialized fields)
    """
    def __init__(self, event):
        super().__init__(event)


class IoTTwinMakerUDQComponentTypeRequest(IoTTwinMakerUdqRequest):
    """
    Models an component-type-level request (currently more of a placeholder for specialized fields)
    """
    def __init__(self, event):
        super().__init__(event)