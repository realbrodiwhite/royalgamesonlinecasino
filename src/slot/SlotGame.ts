import { Application, Container, Texture, Renderer } from 'pixi.js';
import Reel from './Reel';
import { ReelsController } from './ReelsController';

export default class SlotGame {
  app: Application;
  reels: Reel[];
  reelsContainer: Container;
  reelsController: ReelsController;
  renderer: Renderer;

  constructor(textures: Texture[]) {
    // Create application with options directly
    this.app = new Application({
      width: 800,
      height: 600,
      backgroundColor: 0x000000,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    this.renderer = this.app.renderer;

    // Create the reels container
    this.reelsContainer = new Container();
    this.app.stage.addChild(this.reelsContainer);

    // Create the reels
    this.reels = [];
    const REEL_WIDTH = 160;
    for (let i = 0; i < 5; i++) {
      const reel = new Reel(textures);
      reel.container.x = i * REEL_WIDTH;
      this.reels.push(reel);
      this.reelsContainer.addChild(reel.container);
    }

    // Center the reels container
    this.reelsContainer.x = (this.app.screen.width - this.reelsContainer.width) / 2;
    this.reelsContainer.y = 100;

    // Create the reels controller
    this.reelsController = new ReelsController(this.reels);

    // Start the animation loop
    this.app.ticker.add(() => {
      this.reels.forEach(reel => reel.update());
    });
  }

  destroy(): void {
    this.app.destroy(true);
  }
}
