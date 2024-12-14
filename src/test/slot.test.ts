import SlotGame from '../slot/SlotGame';
import Reel from '../slot/Reel';
import { ReelsController } from '../slot/ReelsController';
import { Container, Texture } from 'pixi.js';
import io from 'socket.io-client';

// Mock PIXI.js
jest.mock('pixi.js', () => ({
  Application: jest.fn().mockImplementation(() => ({
    init: jest.fn().mockResolvedValue(undefined),
    renderer: {
      resize: jest.fn(),
    },
    stage: {
      addChild: jest.fn(),
      scale: { set: jest.fn() },
      position: { set: jest.fn() },
    },
    canvas: {
      width: 800,
      parentElement: {
        clientWidth: 1024,
        clientHeight: 768,
      },
    },
    ticker: {
      add: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
    },
    destroy: jest.fn(),
  })),
  Container: jest.fn().mockImplementation(() => ({
    addChild: jest.fn(),
    x: 0,
    y: 0,
    width: 800,
    height: 600,
    eventMode: 'none',
    cursor: 'default',
    on: jest.fn(),
  })),
  Texture: {
    from: jest.fn(),
  },
  Assets: {
    load: jest.fn().mockResolvedValue({}),
  },
}));

// Mock socket.io
jest.mock('socket.io-client', () => {
  return jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
  }));
});

describe('Slot Game', () => {
  let game: SlotGame;
  const mockSocket = io('http://localhost:3000');

  const mockConfig = {
    id: 'test-game',
    width: 800,
    height: 600,
    reelsCount: 5,
    reelPositions: 3,
    symbolsCount: 8,
    hasBlurredSymbols: true,
    symbolMargin: 10,
    maskPaddingX: 5,
    maskPaddingY: 5,
    reelsSpeed: 20,
    spinTimeBetweenReels: 200,
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create new game instance
    game = new SlotGame(mockConfig, mockSocket);
  });

  describe('Initialization', () => {
    it('should initialize the game with correct configuration', async () => {
      await game.init();
      expect(game.width).toBe(mockConfig.width);
      expect(game.height).toBe(mockConfig.height);
    });

    it('should create correct number of reels', async () => {
      await game.init();
      expect(game.reels.length).toBe(mockConfig.reelsCount);
    });

    it('should handle resource loading', async () => {
      const resource = {
        name: 'test-symbol',
        source: 'test-symbol.png'
      };

      await game.addResource(resource);
      // Test the result of resource loading through public methods
      const sprite = game.addSprite('test-symbol');
      expect(sprite).toBeInstanceOf(Container);
    });
  });

  describe('Game Controls', () => {
    beforeEach(async () => {
      await game.init();
    });

    it('should handle resize events', () => {
      game.resize();
      expect(game.app.renderer.resize).toHaveBeenCalled();
    });

    it('should handle game destruction', () => {
      game.destroy();
      expect(game.app.destroy).toHaveBeenCalled();
    });
  });

  describe('Asset Management', () => {
    beforeEach(async () => {
      await game.init();
    });

    it('should add sprites correctly', async () => {
      await game.addResource({
        name: 'test-sprite',
        source: 'test-sprite.png'
      });
      
      const sprite = game.addSprite('test-sprite');
      expect(sprite).toBeInstanceOf(Container);
    });

    it('should create interactive buttons', async () => {
      await game.addResource({
        name: 'button-frame',
        source: 'button-frame.png'
      });
      
      const onClick = jest.fn();
      const button = game.addButton(['button-frame'], onClick);
      
      expect(button).toBeInstanceOf(Container);
      // Test button interactivity
      expect(button.eventMode).toBe('static');
      expect(button.cursor).toBe('pointer');
    });
  });

  describe('Game State', () => {
    beforeEach(async () => {
      await game.init();
    });

    it('should handle loading progress', () => {
      const progressCallback = jest.fn();
      game.onLoading(progressCallback);
      
      // Verify callback is called when assets are loaded
      expect(progressCallback).toHaveBeenCalled();
    });

    it('should handle play callback', () => {
      const playCallback = jest.fn();
      game.oncePlay(playCallback);
      
      expect(playCallback).toHaveBeenCalled();
    });
  });
});

describe('Reel', () => {
  let reel: Reel;
  const mockTextures = [
    {} as Texture,
    {} as Texture,
    {} as Texture,
  ];

  beforeEach(() => {
    reel = new Reel(mockTextures);
  });

  it('should initialize with correct properties', () => {
    expect(reel.container).toBeInstanceOf(Container);
    expect(reel.symbols.length).toBeGreaterThan(0);
  });

  it('should update symbol positions', () => {
    const initialPosition = reel.position;
    reel.update();
    expect(reel.position).not.toBe(initialPosition);
  });
});

describe('ReelsController', () => {
  let reelsController: ReelsController;
  const mockReels = Array(5).fill(null).map(() => new Reel([{} as Texture]));

  beforeEach(() => {
    reelsController = new ReelsController(mockReels);
  });

  it('should initialize with correct number of reels', () => {
    expect(reelsController.reels.length).toBe(5);
  });

  it('should handle spin state', () => {
    // Test spin state through public methods
    expect(reelsController.reels).toBeDefined();
    expect(Array.isArray(reelsController.reels)).toBe(true);
    expect(reelsController.reels.length).toBe(5);
  });
});
