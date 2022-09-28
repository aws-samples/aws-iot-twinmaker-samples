// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2022
// SPDX-License-Identifier: Apache-2.0

export class Transform {
  private position: Vector3;
  private rotation: Vector3;
  private scale: Vector3;

  constructor() {
    this.position = { x: 0, y: 0, z: 0 };
    this.rotation = { x: 0, y: 0, z: 0 };
    this.scale = { x: 1, y: 1, z: 1 };
  }

  setPosition(position: Vector3): Transform {
    this.position = position;
    return this;
  }

  setRotation(rotation: Vector3): Transform {
    this.rotation = rotation;
    return this;
  }

  setScale(scale: Vector3): Transform {
    this.scale = scale;
    return this;
  }

  /**
   * @internal
   */
  getPosition(): Vector3 {
    return this.position;
  }

  /**
   * @internal
   */
  getRotation(): Vector3 {
    return this.rotation;
  }

  /**
   * @internal
   */
  getScale(): Vector3 {
    return this.scale;
  }
}

export class NavLink {
  destination?: string;
  params?: Map<string, any>;

  constructor() {
    this.params = new Map<string, any>();
  }
  public withDestination(destination: string): NavLink {
    this.destination = destination;
    return this;
  }

  public withParams(params: Map<string, any>): NavLink {
    this.params = params;
    return this;
  }
}

export type Vector3 = {
  x: number;
  y: number;
  z: number;
};

export class Rule {
  private statements: Statement[];

  constructor() {
    this.statements = [];
  }

  // @internal
  getStatements(): Statement[] {
    return this.statements;
  }

  public addStatement(statement: Statement) {
    this.statements.push(statement);
  }

  public addStatements(statements: Statement[]) {
    for (const statement of statements) {
      this.addStatement(statement);
    }
  }
}

export class Statement {
  private expression: string;
  private target: Target;

  constructor(expression: string, target: Target) {
    if (target) this.expression = expression;
    this.target = target;
  }

  getExpression(): string {
    return this.expression;
  }

  getTarget(): Target {
    return this.target;
  }
}

export enum Target {
  INFO,
  WARNING,
  ERROR,
  VIDEO,
  RED,
  GREEN,
  YELLOW,
  EMPTY,
}

export type EnvironmentPreset = 'neutral' | 'directional' | 'chromatic';

export type DistanceUnit =
  | 'millimeters'
  | 'centimeters'
  | 'decimeters'
  | 'meters'
  | 'kilometers'
  | 'inches'
  | 'feet'
  | 'yards'
  | 'miles';

export type ModelType = 'GLTF' | 'GLB' | 'Tiles3D';

export type MotionIndicatorShape = 'LinearPlane' | 'LinearCylinder' | 'CircularCylinder';
