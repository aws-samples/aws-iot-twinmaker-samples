#!/bin/sh

# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

SERVER_PID=$(ps -ax | grep "[c]hainlit" | awk '{print $1}')
[ ! -z "$SERVER_PID" ] && kill -9 $SERVER_PID
