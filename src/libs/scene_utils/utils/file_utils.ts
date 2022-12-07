// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2022
// SPDX-License-Identifier: Apache-2.0

export const isWin = process.platform === 'win32';

export const withTrailingSlash = (dirPath: string) => {
  const trailingChar = isWin ? '\\' : '/';
  return dirPath.endsWith(trailingChar) ? dirPath : `${dirPath}${trailingChar}`;
};

export const logProgress = (logString: string) => {
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  process.stdout.write(logString);
};
