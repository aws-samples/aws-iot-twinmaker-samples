// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2022
// SPDX-License-Identifier: Apache-2.0

export const isWin = process.platform === 'win32';

export const getFileNameFromPath = (assetPath: string | undefined): string => {
  if (!!assetPath) {
    const sep = isWin ? '\\' : '/';
    const pathSplit = assetPath.split(sep);
    return pathSplit[pathSplit.length - 1];
  }
  return '';
};

export const logProgress = (logString: string) => {
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  process.stdout.write(logString);
};
