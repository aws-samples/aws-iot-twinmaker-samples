# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import udq_constants
from datetime import datetime

class UDQParamsParser:
    def __init__(self, event):
        self.event = event

    def get_workspace_id(self):
        return self.event.get(udq_constants.WORKSPACE_ID)

    def get_entity_id(self):
        return self.event.get(udq_constants.ENTITY_ID)

    def get_component_name(self):
        return self.event.get(udq_constants.COMPONENT_NAME)

    def get_component_type_id(self):
        return self.event.get(udq_constants.COMPONENT_TYPE_ID)

    def get_properties(self):
        return self.event.get(udq_constants.PROPERTIES)

    def get_selected_properties(self):
        return self.event.get(udq_constants.SELECTED_PROPERTIES)

    def get_s3_url(self):
        component_properties = self.get_properties()
        if udq_constants.S3_URL in component_properties:
            return component_properties[udq_constants.S3_URL][udq_constants.PROPERTY_VALUE][udq_constants.PROPERTY_STRING_VALUE]
        else:
            return None
