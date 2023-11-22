# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
# SPDX-License-Identifier: Apache-2.0

import boto3
import datetime
import pandas as pd
import json
from tabulate import tabulate

from ...env import get_aws_region, get_workspace_id

iottwinmaker = boto3.client('iottwinmaker', region_name=get_aws_region())

WORKSPACE_ID = get_workspace_id()

class Column:
  def __init__(self, name, type):
    self.name = name
    self.type = type

  def __repr__(self):
    return f"{self.name}"


class GenericValue:
  def __init__(self, value):
    self.value = value

  def __repr__(self):
    if isinstance(self.value, dict):
      return json.dumps(self.value)
    else:
      return str(self.value)


class EntityValue:
  def __init__(self, value):
    self.entityId = value['entityId']
    self.entityName = value['entityName']
    
  def __repr__(self):
    return f"{self.entityName} [{self.entityId}]"


def parse_value(col, value):
  if value is None:
    return None
  
  if col.type == 'NODE':
    return EntityValue(value)
  elif isinstance(value, str):
    return value
  return GenericValue(value)


def execute_query(query:str)->pd.DataFrame:
  query_result = iottwinmaker.execute_query(
    workspaceId=WORKSPACE_ID,
    queryStatement=query
  )
  
  if 'columnDescriptions' not in query_result:
    return pd.DataFrame()
  
  headers = [d['name'] for d in query_result['columnDescriptions']]
  columns = [Column(d['name'], d['type']) for d in query_result['columnDescriptions']]
  
  rows = []
  for r in query_result["rows"]:
    rowData = r['rowData']
    rows.append([parse_value(columns[i], v) for i, v in enumerate(rowData)])
  
  df = pd.DataFrame(rows, columns=headers)
  
  # fill in time series data
  if 'propertyValue' in headers \
    and 'entityId' in headers \
    and 'componentName' in headers \
    and 'propertyName' in headers:
    for index, row in df.iterrows():
      if row['propertyValue'] is None and row['propertyName'] != 'Resources':
        entityId = row['entityId']
        componentName = row['componentName']
        propertyName = row['propertyName']
        response = iottwinmaker.get_property_value_history(
          workspaceId=WORKSPACE_ID,
          entityId=entityId,
          componentName=componentName,
          selectedProperties=[
              propertyName,
          ],
          maxResults=1,
          endTime=datetime.datetime.now().isoformat() + 'Z',
          startTime=(datetime.datetime.now() - datetime.timedelta(days=1)).isoformat() + 'Z',
          orderByTime='DESCENDING'
        )
        
        propertyValueRaw = response['propertyValues'][0]['values'][0]['value']
        
        if 'stringValue' in propertyValueRaw:
          propertyValue = propertyValueRaw['stringValue']
        elif 'doubleValue' in propertyValueRaw:
          propertyValue = str(propertyValueRaw['doubleValue'])
        elif 'integerValue' in propertyValueRaw:
          propertyValue = str(propertyValueRaw['integerValue'])
        else:
          propertyValue = str(propertyValueRaw)
        df.at[index, 'propertyValue'] = propertyValue
  
  return df


def execute_query_and_format(query: str) -> str:
  """Sends a PartiQL query to AWS ioT TwinMaker and returns the results."""

  df = execute_query(query)
  
  if df.shape[0] == 0:
    return "No results"
  
  # Drop entityId and componentName columns
  if 'entityId' in df.columns:
    df = df.drop(columns=['entityId'])
  if 'componentName' in df.columns:
    df = df.drop(columns=['componentName'])
  
  # Format the query result
  res = tabulate(df, df.columns, tablefmt="pipe")
  print(res)
  
  return res
