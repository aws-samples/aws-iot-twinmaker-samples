#!/bin/sh

# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

chainlit run app/bedrock.py 2>&1 > .chainlit/app.log &
