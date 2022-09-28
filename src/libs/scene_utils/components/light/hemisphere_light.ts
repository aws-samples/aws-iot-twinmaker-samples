// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2022
// SPDX-License-Identifier: Apache-2.0

import { Light } from './light';
import { HEMISPHERE_LIGHT } from './light_type';

export class HemisphereLight extends Light {
  public readonly lightType: string = HEMISPHERE_LIGHT;
  groundColor: number;
}
