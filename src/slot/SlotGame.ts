import { Application, Container, Texture, Renderer, Assets, Sprite } from 'pixi.js';
import Reel from './Reel';
import { ReelsController } from './ReelsController';

interface SpriteSheetAsset extends Record<string, unknown> {
  textures: { [key: string]: Texture };
  animations?: { [key: string]: Texture[] };
}

type GameAsset = Texture | SpriteSheetAsset;

// Helper function to extract texture from asset
function getTextureFromAsset(asset: GameAsset): Texture {
  if ('textures' in asset) {
    return Object.values(asset.textures)[0];
  }
  return asset as Texture;
}

interface Resource {
  name: string;
  source: string;
}

interface GameConfig {
  id: string;
  width: number;
  height: number;
  reelsCount: number;
  reelPositions: number;
  symbolsCount: number;
  hasBlurredSymbols: boolean;
  symbolMargin: number;
  maskPaddingX: number;
  maskPaddingY: number;
  reelsSpeed: number;
  spinTimeBetweenReels: number;
}

interface BetResponse {
  isWin: boolean;
  win: Array<{
    map: number[][];
    count: number;
    number: number;
  }>;
}

export default class SlotGame {
  app: Application;
  reels!: Reel[];
  reelsContainer!: Container;
  reelsController!: ReelsController;
  renderer!: Renderer;
  private readonly textures: Map<string, GameAsset>;
  private resources: Map<string, Resource>;
  stage: Container;
  soundAssets: { [key: string]: HTMLAudioElement } = {};
  betResponse: BetResponse | null = null;
  ticker: Application['ticker'];
  width: number;
  height: number;
  private readonly socket: WebSocket;

  constructor(config: GameConfig, socket: WebSocket) {
    if (typeof window === 'undefined') {
      throw new Error('SlotGame must be initialized in browser environment');
    }

    // Create application
    this.app = new Application();
    this.textures = new Map();
    this.resources = new Map();
    this.stage = new Container();
    this.width = config.width;
    this.height = config.height;
    this.ticker = this.app.ticker;
    this.socket = socket;
  }

  async init() {
    // Initialize the application
    await this.app.init({
      width: this.width,
      height: this.height,
      backgroundColor: 0x000000,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    this.renderer = this.app.renderer;
    this.app.stage.addChild(this.stage);

    // Create the reels container
    this.reelsContainer = new Container();
    this.stage.addChild(this.reelsContainer);

    // Create the reels
    this.reels = [];
    const REEL_WIDTH = 160;
    for (let i = 0; i < 5; i++) {
      // Filter out non-texture assets and convert spritesheet assets to textures
      const textures = Array.from(this.textures.values())
        .filter((asset): asset is Texture => 
          asset instanceof Texture || 'textures' in asset
        )
        .map(getTextureFromAsset);
      const reel = new Reel(textures);
      reel.container.x = i * REEL_WIDTH;
      this.reels.push(reel);
      this.reelsContainer.addChild(reel.container);
    }

    // Center the reels container
    const appWidth = this.app.canvas.width;
    if (appWidth) {
      this.reelsContainer.x = (appWidth - this.reelsContainer.width) / 2;
      this.reelsContainer.y = 100;
    }

    // Create the reels controller
    this.reelsController = new ReelsController(this.reels);

    // Start the animation loop
    this.app.ticker.add(() => {
      this.reels.forEach(reel => reel.update());
    });
  }

  async addResource(resource: Resource | Resource[]) {
    const resources = Array.isArray(resource) ? resource : [resource];
    const loadPromises = [];
    
    for (const res of resources) {
      this.resources.set(res.name, res);
      const loadPromise = Assets.load(res.source)
        .then(asset => {
          // Store the asset regardless of type
          this.textures.set(res.name, asset);
          console.log(`Loaded asset: ${res.name}`);
        })
        .catch(error => {
          console.error(`Error loading asset ${res.name}:`, error);
        });
      loadPromises.push(loadPromise);
    }
    
    await Promise.all(loadPromises);
  }

  addSprite(name: string): Container {
    const container = new Container();
    const asset = this.textures.get(name);
    
    if (!asset) {
      console.error(`Asset not found for sprite: ${name}`);
      return container;
    }

    try {
      const sprite = new Sprite(getTextureFromAsset(asset));
      container.addChild(sprite);
    } catch (error) {
      console.error(`Error creating sprite ${name}:`, error);
    }
    
    return container;
  }

  addButton(frames: string[], onClick: () => void): Container {
    const button = new Container();
    button.eventMode = 'static';
    button.cursor = 'pointer';
    button.on('click', onClick);
    
    // Add button frames
    frames.forEach(frame => {
      try {
        const asset = this.textures.get(frame);
        if (!asset) {
          throw new Error(`Asset not found for button frame: ${frame}`);
        }
        const sprite = new Sprite(getTextureFromAsset(asset));
        button.addChild(sprite);
      } catch (error) {
        console.error(`Error creating button frame ${frame}:`, error);
      }
    });
    
    return button;
  }

  resize() {
    if (this.app.canvas) {
      const parent = this.app.canvas.parentElement;
      if (parent) {
        this.app.renderer.resize(parent.clientWidth, parent.clientHeight);
        
        // Update stage scale to maintain aspect ratio
        const scale = Math.min(
          parent.clientWidth / this.width,
          parent.clientHeight / this.height
        );
        
        this.stage.scale.set(scale);
        this.stage.position.set(
          (parent.clientWidth - this.width * scale) / 2,
          (parent.clientHeight - this.height * scale) / 2
        );
      }
    }
  }

  onInit(callback: () => void) {
    const loadPromises = Array.from(this.resources.values()).map(res => 
      Assets.load(res.source)
        .then(asset => {
          this.textures.set(res.name, asset);
          return asset;
        })
    );

    Promise.all(loadPromises)
      .then(() => {
        callback();
      })
      .catch(error => {
        console.error('Error loading assets:', error);
      });
  }

  onLoading(callback: (progress: number) => void) {
    const bundleAssets = Array.from(this.resources.values()).map(r => ({
      alias: r.name,
      src: r.source
    }));
    
    let loadedCount = 0;
    const totalCount = bundleAssets.length;
    
    bundleAssets.forEach(asset => {
      Assets.load(asset.src).then(() => {
        loadedCount++;
        callback(loadedCount / totalCount);
      });
    });
  }

  oncePlay(callback: () => void) {
    callback();
  }

  onDestroy(callback: () => void) {
    this.app.destroy();
    callback();
  }

  start() {
    // Start the game
    this.app.start();
  }

  destroy(): void {
    this.app.destroy(true);
  }
}
