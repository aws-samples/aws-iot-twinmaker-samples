// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2022
// SPDX-License-Identifier: Apache-2.0

export const isEmptyString = (targetString: string): boolean => {
  if (!targetString || targetString === '') {
    return true;
  }
  return false;
};
