# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2021
# SPDX-License-Identifier: Apache-2.0

from abc import ABC, abstractmethod
from datetime import datetime
from typing import List

from udq_utils.udq_models import IoTTwinMakerReference, IoTTwinMakerUnifiedDataQuery, IoTTwinMakerUDQEntityRequest, IoTTwinMakerUDQComponentTypeRequest


# ---------------------------------------------------------------------------
#   Connector implementation guide:
#
#   1. Create a connector class implementation that extends one or both of SingleEntityReader, MultiEntityReader
#        your implementation is responsible for taking a UDQ request and returning a list of IoTTwinMakerDataRows from servicing
#        the UDQ query against your supported data source
#
#   2. Create an implementation of IoTTwinMakerDataRow
#        your implementation is a wrapper on the data rows retrieved from your data source and is responsible for
#        extracting the entityPropertyReference, timestamp, and value from the data row
#
#   3. Invoke process_query(lambda_event) in your lambda handler on your connector implementation
#      this will invoke IoTTwinMakerUnifiedDataQuery.process_query() which will handle JSON payload marshalling/unmarshalling and
#      invoke your above implementations to fetch and process the query results
# ---------------------------------------------------------------------------

class IoTTwinMakerDataRow(ABC):
    """
    Interface for an AWS IoT TwinMaker data row

    Implementations must handle taking a data row and returning the:
    - IoTTwinMakerReference that uniquely identifies the property location of this row
    - Timestamp for the row
    - Value for the row
    """

    @abstractmethod
    def get_iottwinmaker_reference(self) -> IoTTwinMakerReference:
        """
        For this telemetry data point, return its AWS IoT TwinMaker property reference
        Can include 2 parts (at least one must be provided):
        1. An IoT TwinMaker reference that uniquely maps to the property definition of this data point as defined in the IoT TwinMaker model
            {
                "entityId": ,
                "componentName":,
                "propertyName":
            }
        2. An external_id_property definition that uniquely identifies this data point in your storage system
           This definition must match the information provided when modeling your component types and entities
            {
                string_value: string_value
            }
        Please refer to the AWS IoT TwinMaker documentation for modeling component types and entities

        :return: AWS IoT TwinMaker property reference
        """
        raise NotImplementedError("get_iottwinmaker_reference not implemented")

    def get_timestamp(self) -> datetime:
        """
        :return: the timestamp for this row as a datetime object
        """
        raise NotImplementedError("get_timestamp not implemented")

    @abstractmethod
    def get_iso8601_timestamp(self) -> str:
        """
        :return: the timestamp for this row as an ISO8601 string
        """
        return None

    @abstractmethod
    def get_value(self):
        """
        :return: the data value for this row as a python-native type
        """
        raise NotImplementedError("get_value not implemented")

    def __str__(self):
        return str(self.__dict__)


class IoTTwinMakerUdqResponse:
    """
    IoTTwinMakerUdqResponse models the return from the UDQ Lambda

    The UDQ framework will handle marshalling this IoTTwinMakerUdqResponse object into the JSON payload expected by IoT TwinMaker
    It consists of a List of Connector Author implemented IoTTwinMakerDataRow and optional nextToken for pagination
    """

    def __init__(self, rows: List[IoTTwinMakerDataRow], next_token: str = None):
        self._rows = rows
        self._next_token = next_token

    @property
    def rows(self):
        return self._rows

    @property
    def next_token(self):
        return self._next_token

    def __str__(self):
        return str(self.__dict__)


class SingleEntityReader(IoTTwinMakerUnifiedDataQuery, ABC):
    """
    Interface for an AWS IoT TwinMaker UDQ connector that supports single-entity queries

    Connector authors must implement the entity_query function
    """
    @abstractmethod
    def entity_query(self, request: IoTTwinMakerUDQEntityRequest) -> IoTTwinMakerUdqResponse:
        raise NotImplementedError("entity_query not implemented")


class MultiEntityReader(IoTTwinMakerUnifiedDataQuery, ABC):
    """
    Interface for an AWS IoT TwinMaker UDQ connector that supports single-entity queries

    Connector authors must implement the component_type_query function
    """
    @abstractmethod
    def component_type_query(self, request: IoTTwinMakerUDQComponentTypeRequest) -> IoTTwinMakerUdqResponse:
        raise NotImplementedError("component_type_query not implemented")
