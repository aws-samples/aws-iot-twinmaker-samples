// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2022
// SPDX-License-Identifier: Apache-2.0

export function bufferToJson(buffer: Buffer) {
  if (buffer.length === 0) {
    return {};
  }
  return JSON.parse(buffer.toString());
}
