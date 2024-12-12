import { Application, Container, IRenderer, Sprite, Texture } from 'pixi.js';

declare module '@/slot/Reel' {
  export default class Reel {
    container: Container;
    symbols: Sprite[];
    position: number;
    previousPosition: number;
    running: boolean;
    constructor(textures: Texture[]);
    update(): void;
    stop(): void;
  }
}

declare module '@/slot/SlotGame' {
  export default class SlotGame {
    app: Application;
    reels: import('@/slot/Reel').default[];
    reelsContainer: Container;
    reelsController: import('@/slot/ReelsController').ReelsController;
    renderer: IRenderer;
    constructor(textures: Texture[]);
    destroy(): void;
  }
}

declare module '@/slot/ReelsController' {
  import Reel from '@/slot/Reel';
  
  export class ReelsController {
    reels: Reel[];
    running: boolean;
    spinDuration: number;
    spinningReels: number;
    onComplete?: () => void;
    constructor(reels: Reel[]);
    spin(onComplete?: () => void): void;
    stop(): void;
  }
}

declare module '@/slot/initControls' {
  import { Container, Sprite, Texture } from 'pixi.js';
  import { ReelsController } from '@/slot/ReelsController';

  export interface Controls {
    container: Container;
    spinButton: Sprite;
  }

  export default function initControls(
    textures: Record<string, Texture>,
    reelsController: ReelsController,
    onSpin?: () => void
  ): Controls;
}
