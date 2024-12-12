import { Application, Container, Sprite, Texture } from 'pixi.js';

export interface GameInstance {
  app: Application;
  renderer: any;
  destroy: () => void;
}

export interface Controls {
  container: Container;
  spinButton: Sprite;
}

export interface GameScript {
  (
    gameId: string,
    Game: typeof SlotGame,
    Reel: typeof Reel,
    initControls: typeof initControls,
    socket: any,
    PIXI: typeof import('pixi.js'),
    gsap: typeof import('gsap'),
    goToLobby: () => void
  ): GameInstance;
}

// Re-export the game-related classes and functions
export { default as Reel } from '@/slot/Reel';
export { default as SlotGame } from '@/slot/SlotGame';
export { default as initControls } from '@/slot/initControls';
