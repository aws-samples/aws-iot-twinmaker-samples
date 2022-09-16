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
