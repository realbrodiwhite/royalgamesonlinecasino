import { Container, Sprite, Texture } from 'pixi.js';

export default class Reel {
  container: Container;
  symbols: Sprite[];
  position: number;
  previousPosition: number;
  running: boolean;
  values: number[];

  constructor(textures: Texture[]) {
    this.container = new Container();
    this.symbols = [];
    this.values = [];
    this.position = 0;
    this.previousPosition = 0;
    this.running = false;

    // Create the symbols
    for (let i = 0; i < 4; i++) {
      const randomIndex = Math.floor(Math.random() * textures.length);
      const texture = textures[randomIndex];
      const symbol = new Sprite(texture);
      
      // Set initial dimensions
      const targetWidth = 160; // Standard symbol width
      const targetHeight = 160; // Standard symbol height
      const scale = Math.min(targetWidth / texture.width, targetHeight / texture.height);
      
      symbol.scale.set(scale);
      symbol.anchor.set(0.5);
      symbol.x = targetWidth / 2;
      symbol.y = i * targetHeight + targetHeight / 2;
      
      this.symbols.push(symbol);
      this.values.push(randomIndex + 1);
      this.container.addChild(symbol);
    }
  }

  update(): void {
    if (!this.running) return;

    this.previousPosition = this.position;

    const symbolHeight = 160; // Standard symbol height
    for (let i = 0; i < this.symbols.length; i++) {
      const symbol = this.symbols[i];
      const prevY = symbol.y;
      symbol.y = ((this.position + i) % this.symbols.length) * symbolHeight + symbolHeight / 2 - this.position * symbolHeight;
      
      if (symbol.y < 0 && prevY > symbolHeight) {
        // Update symbol texture when it goes off screen
        const randomIndex = Math.floor(Math.random() * this.symbols.length);
        const newTexture = this.symbols[randomIndex].texture;
        symbol.texture = newTexture;
        this.values[i] = randomIndex + 1;
        
        // Maintain scale and anchor
        const targetWidth = 160;
        const targetHeight = 160;
        const scale = Math.min(targetWidth / newTexture.width, targetHeight / newTexture.height);
        symbol.scale.set(scale);
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

  onceStart(callback: () => void): void {
    if (this.running) {
      callback();
    } else {
      const checkRunning = () => {
        if (this.running) {
          callback();
          this.container.off('added', checkRunning);
        }
      };
      this.container.on('added', checkRunning);
    }
  }
}
