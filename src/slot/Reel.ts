import { Container, Sprite, Texture } from 'pixi.js';

export default class Reel {
  container: Container;
  symbols: Sprite[];
  position: number;
  previousPosition: number;
  running: boolean;

  constructor(textures: Texture[]) {
    this.container = new Container();
    this.symbols = [];
    this.position = 0;
    this.previousPosition = 0;
    this.running = false;

    // Create the symbols
    for (let i = 0; i < 4; i++) {
      const symbol = new Sprite(textures[Math.floor(Math.random() * textures.length)]);
      symbol.y = i * symbol.height;
      symbol.scale.x = symbol.scale.y = Math.min(symbol.width / symbol.texture.width, symbol.height / symbol.texture.height);
      this.symbols.push(symbol);
      this.container.addChild(symbol);
    }
  }

  update(): void {
    if (!this.running) return;

    this.previousPosition = this.position;

    for (let i = 0; i < this.symbols.length; i++) {
      const symbol = this.symbols[i];
      const prevY = symbol.y;
      symbol.y = ((this.position + i) % this.symbols.length) * symbol.height - this.position * symbol.height;
      
      if (symbol.y < 0 && prevY > symbol.height) {
        const r = Math.floor(Math.random() * this.symbols.length);
        symbol.texture = this.symbols[r].texture;
      }
    }
  }

  stop(): void {
    this.running = false;
    const target = Math.floor(this.position);
    const diff = this.position - target;
    if (diff > 0.01) {
      this.position = target + 1;
    } else {
      this.position = target;
    }
  }
}
