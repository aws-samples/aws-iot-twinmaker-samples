// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2022
// SPDX-License-Identifier: Apache-2.0

export const LIGHT_TYPE = 'Light';
export const MODEL_REF_TYPE = 'ModelRef';
export const MODEL_SHADER_TYPE = 'ModelShader';
export const MOTION_INDICATOR_TYPE = 'MotionIndicator';
export const TAG_TYPE = 'Tag';

export type ComponentType =
  | typeof LIGHT_TYPE
  | typeof MODEL_REF_TYPE
  | typeof MODEL_SHADER_TYPE
  | typeof MOTION_INDICATOR_TYPE
  | typeof TAG_TYPE;
