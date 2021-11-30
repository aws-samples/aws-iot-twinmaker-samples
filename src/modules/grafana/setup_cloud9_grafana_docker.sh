#!/bin/bash

# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

SCRIPT_DIR=${HOME}

CONTAINER_NAME=cookiefactory-grafana

mkdir -p ${SCRIPT_DIR}/local_grafana_data/plugins
chmod 777 ${SCRIPT_DIR}/local_grafana_data
chmod 777 ${SCRIPT_DIR}/local_grafana_data/plugins
sudo usermod -a -G docker ec2-user

# Overwrite the grafana plugin with the latest code from the zip
rm -rf ${SCRIPT_DIR}/local_grafana_data/plugins/grafana-iot-twinmaker-app

# Remove a container if it exists. Using a volume to persist data so the new container
# will have the same configuration.
docker rm --force ${CONTAINER_NAME} &> /dev/null

docker run -d \
  -p 80:3000 \
  --name=${CONTAINER_NAME} \
  -v ${SCRIPT_DIR}/local_grafana_data:/var/lib/grafana \
  -e "GF_INSTALL_PLUGINS=grafana-iot-twinmaker-app" \
  grafana/grafana:8.2.5