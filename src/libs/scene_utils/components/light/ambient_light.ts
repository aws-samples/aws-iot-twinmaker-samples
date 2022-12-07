// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2022
// SPDX-License-Identifier: Apache-2.0

import { Light } from './light';
import { AMBIENT_LIGHT } from './light_type';

export class AmbientLight extends Light {
  public readonly lightType: string = AMBIENT_LIGHT;
}
