#!/bin/bash

# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

SCRIPT_DIR=${HOME}

CONTAINER_NAME=cookiefactory-grafana

# Make a directory to persist the data from our local running instance of grafana.
# Mapping this directory into the grafana container allows your work in the grafana
# container to be saved between run.  Most notibly will be a grafana.db file which will
# contain your configured dashboards.  This directory will be ignored by git becuase of
# the .gitignore file we have placed in parent directory.
mkdir -p ${SCRIPT_DIR}/local_grafana_data/plugins

# Overwrite the grafana plugin with the latest code
rm -rf ${SCRIPT_DIR}/local_grafana_data/plugins/grafana-iot-twinmaker-app

# Remove a container if it exists. Using a volume to persist data so the new container
# will have the same configuration.
docker rm --force ${CONTAINER_NAME} &> /dev/null

docker run -d \
  -p 3000:3000 \
  --name=${CONTAINER_NAME} \
  -v ~/.aws:/usr/share/grafana/.aws \
  -v ${SCRIPT_DIR}/local_grafana_data:/var/lib/grafana \
  -e "GF_INSTALL_PLUGINS=grafana-iot-twinmaker-app" \
  grafana/grafana:8.4.0
