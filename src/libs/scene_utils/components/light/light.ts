// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2022
// SPDX-License-Identifier: Apache-2.0

import { Component } from '../component';

export class Light extends Component {
  color: number;
  intensity: number;
  constructor() {
    super();
    this.type = 'Light';
    this.color = 0xffffff;
    this.intensity = 1.0;
  }
}
