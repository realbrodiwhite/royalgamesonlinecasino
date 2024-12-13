const symbolsCount = 12;

const game = new Game({
  id: 'egyptian-treasures',
  width: 1280,
  height: 960,
  reelsCount: 5,
  reelPositions: 3,
  symbolsCount,
  hasBlurredSymbols: true,
  symbolMargin: 0,
  maskPaddingX: 0,
  maskPaddingY: 0,
  reelsSpeed: 0.17,
  spinTimeBetweenReels: 135,
}, socket);

// Define gameId from the game instance
const gameId = game.config.id;
const assetsUrl = `/data/${gameId}/`;

async function initGame() {
  try {
    // Initialize the game first
    await game.init();

    // Create loading screen container that will be on top of everything
    const loadingContainer = new PIXI.Container();
    loadingContainer.zIndex = 1000;
    game.stage.addChild(loadingContainer);
    game.stage.sortableChildren = true;

    // Hide the main game container initially
    game.stage.visible = false;

    console.log('Loading assets from:', assetsUrl);

    // Load loading screen assets first
    await PIXI.Assets.load([
      `${assetsUrl}Loading/Loading screen.jpg`,
      `${assetsUrl}Loading/loading-bar-spritesheet.json`,
      `${assetsUrl}Loading/loading-text-spritesheet.json`
    ]);

    // Setup loading screen
    const loadingBackground = PIXI.Sprite.from(`${assetsUrl}Loading/Loading screen.jpg`);
    loadingContainer.addChild(loadingBackground);

    const loadingBarData = PIXI.Assets.cache.get(`${assetsUrl}Loading/loading-bar-spritesheet.json`);
    const loadingBarTextures = Object.values(loadingBarData.data.animations.LoadingBar)
      .map(frame => PIXI.Texture.from(frame));
    
    const loadingBar = new PIXI.Sprite(loadingBarTextures[0]);
    loadingBar.x = (1280 - loadingBar.width) / 2;
    loadingBar.y = 700;
    loadingContainer.addChild(loadingBar);
    
    const loadingTextData = PIXI.Assets.cache.get(`${assetsUrl}Loading/loading-text-spritesheet.json`);
    const loadingText = new PIXI.AnimatedSprite(
      Object.values(loadingTextData.data.animations.Loading)
        .map(frame => PIXI.Texture.from(frame))
    );
    loadingText.animationSpeed = 0.3;
    loadingText.x = (1280 - loadingText.width) / 2;
    loadingText.y = 850;
    loadingContainer.addChild(loadingText);
    loadingText.play();

    // Main game assets to load
    const gameAssets = [
      {
        name: 'controls-spritesheet',
        source: `/data/controls-spritesheet.json`,
      },
      {
        name: 'background',
        source: `${assetsUrl}Back.jpg`,
      },
      {
        name: 'symbols-spritesheet',
        source: `${assetsUrl}symbols-spritesheet.json`,
      },
      {
        name: 'symbol-frames-spritesheet',
        source: `${assetsUrl}symbol-frames-spritesheet.json`,
      },
      {
        name: 'coin-animation-spritesheet',
        source: `/data/coin-animation-spritesheet.json`,
      },
      {
        name: 'logo-spritesheet',
        source: `${assetsUrl}logo-spritesheet.json`,
      },
      {
        name: 'misc-spritesheet',
        source: `${assetsUrl}misc-spritesheet.json`,
      }
    ];

    // Add symbol animation spritesheets
    for (let i = 1; i <= symbolsCount; i++) {
      gameAssets.push({
        name: 'symbol-' + i + '-animation-spritesheet',
        source: `${assetsUrl}symbol-${i}-animation-spritesheet.json`,
      });
    }

    console.log('Loading game assets:', gameAssets);

    // Load game assets
    await game.addResource(gameAssets);

    let loadedAssets = 0;
    const totalAssets = gameAssets.length;

    game.onLoading((progress) => {
      loadedAssets++;
      console.log(`Loading progress: ${loadedAssets}/${totalAssets}`);
      const progressFrame = Math.min(Math.floor((loadedAssets / totalAssets) * 23), 23);
      loadingBar.texture = loadingBarTextures[progressFrame];
      
      // When all assets are loaded
      if (loadedAssets >= totalAssets) {
        console.log('All assets loaded successfully');
        // Fade out loading screen
        gsap.to(loadingContainer, {
          alpha: 0,
          duration: 0.5,
          onComplete: () => {
            // Remove loading screen
            loadingContainer.destroy();
            // Show and initialize game
            game.stage.visible = true;
            setupGame();
            game.start();
          }
        });
      }
    });
  } catch (error) {
    console.error('Error initializing game:', error);
    throw error; // Re-throw to be caught by the game component
  }
}

let keepThrowingCoins = false;
let themeSoundtrack;

async function throwCoins(stage) {
  for (let i = 0; i < 50 && keepThrowingCoins; i++) {
    const coin = PIXI.AnimatedSprite.fromFrames(PIXI.Assets.cache.get('coin-animation-spritesheet').data.animations.coin);
    coin.x = 1280 / 2;
    coin.y = 788;
    coin.anchor.set(0.5, 0.5);
    coin.scale.set(0.25, 0.25);
    stage.addChild(coin);
    coin.play();
    let moveXStep = 50 + Math.random() * 80;
    const coinMovementTimeline = gsap.timeline();
    coinMovementTimeline.to(coin, {
      y: 650,
      duration: 0.4,
      ease: 'back.easeOut',
    });

    coinMovementTimeline.to(coin, {
      y: 1000,
      duration: 0.7,
      ease: 'expo.easeIn',
    });

    if (i % 2 === 0) {
      moveXStep = -moveXStep;
    }
    gsap.to(coin, {
      x: coin.x + moveXStep,
      rotation: 3,
      duration: 0.4 + 0.7,
      onComplete: () => {
        coin.destroy();
      }, 
    });

    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

function setupGame() {
  console.log('Setting up game');
  const background = game.addSprite('background');
  background.z = 2;

  // Create logo components after ensuring assets are loaded
  const logoSprite = PIXI.Assets.cache.get('logo-spritesheet');
  if (logoSprite && logoSprite.data) {
    // Create logo animation
    const logoAnimation = new PIXI.AnimatedSprite(
      logoSprite.data.animations.logo_animation.map(frame => PIXI.Texture.from(frame))
    );
    logoAnimation.x = (1280 - 598) / 2;
    logoAnimation.y = 10;
    logoAnimation.z = 6;
    logoAnimation.animationSpeed = 0.3;
    logoAnimation.play();
    game.stage.addChild(logoAnimation);

    // Create static logo
    const logo = new PIXI.Sprite(PIXI.Texture.from('logo'));
    logo.x = (1280 - 825) / 2;
    logo.x += 15;
    logo.y = 50;
    logo.z = 7;
    game.stage.addChild(logo);
  }

  const btnExit = game.addButton([
    'back_button1.png',
    'back_button2.png',
    'back_button3.png',
    'back_button4.png',
  ], () => {
    goToLobby();
  });
  btnExit.x = 108;
  btnExit.y = 75;
  btnExit.z = 6;

  const btnToggleMusic = game.addButton([
    'music_button1.png',
    'music_button2.png',
    'music_button3.png',
    'music_button4.png',
  ], () => {
    themeSoundtrack.muted = !themeSoundtrack.muted;
    btnToggleMusic.disabled = themeSoundtrack.muted;
  });
  btnToggleMusic.x = 1200;
  btnToggleMusic.y = 75;
  btnToggleMusic.z = 6;

  const reels = game.reelsController.reels;

  reels.forEach((reel, i) => {
    reel.container.x = 57 + (i * 223) + (i * 13);
    reel.container.y = 128;
  });

  const controls = initControls(game);
  controls.scale.x *= 1.1;
  controls.scale.y *= 1.1;
  controls.x -= 1280 * 0.05;
  controls.y = 960 - (controls.height / 2) - 20;

  let linesHighlightComponents = [];
  let lineToHighlight = 0;
  let lineIsBeingHighlighted = false;
  let linesHighlightTime = 0;
  let winDisplayed = false;

  game.ticker.add((delta) => {
    if (game.betResponse && game.betResponse.isWin && !game.reelsController.reelsActive) {
      if (!winDisplayed) {
        keepThrowingCoins = true;
        throwCoins(game.stage);

        game.soundAssets.coinsEffect.volume = 0.4;
        game.soundAssets.coinsEffect.currentTime = 0;
        game.soundAssets.coinsEffect.play();

        winDisplayed = true;
        game.oncePlay(() => {
          game.soundAssets.coinsEffect.pause();
          winDisplayed = false;
          keepThrowingCoins = false;
        });
      }
      if (!lineIsBeingHighlighted) {
        game.betResponse.win.forEach((line, k) => {
          if ((lineToHighlight === 0 || k + 1 === lineToHighlight)) {
            for (let i = 0; i < line.map.length && i < line.count; i++) {
              for (let j = 0; j < line.map[i].length; j++) {
                if (line.map[i][j] === 1) {
                  const symbol = game.reelsController.reels[i].symbols[j];
                  const symbolValue = game.reelsController.reels[i].values[j];
                  let symbolFrame;

                  if (lineToHighlight === 0) {
                    symbolFrame = PIXI.Sprite.from('symbol-frame-back');
                    symbolFrame.anchor.set(0.5, 0.5);
                    symbolFrame.alpha = 0;
                    symbol.addChild(symbolFrame);
                    linesHighlightComponents.push(symbolFrame);

                    gsap.to(symbolFrame, { alpha: 1, duration: 1, ease: 'linear' });
                  }

                  const animation = PIXI.AnimatedSprite.fromFrames(PIXI.Assets.cache.get('symbol-' + symbolValue + '-animation-spritesheet').data.animations['symbol' + symbolValue]);
                  animation.anchor.set(0.5, 0.5);
                  animation.loop = false;
                  animation.animationSpeed = 0.3;
                  symbol.addChild(animation);
                  animation.onComplete = () => {
                    symbol.hide = false;
                    setTimeout(() => {
                      if (!animation.destroyed) {
                        animation.destroy();
                        symbolFrame.destroy();
                      }
                    });
                  };
                  game.reelsController.reels[i].onceStart(() => {
                    symbol.hide = false;
                    setTimeout(() => {
                      if (!animation.destroyed) {
                        animation.destroy();
                        symbolFrame.destroy();
                      }
                    });
                  });
                  symbol.hide = true;
                  animation.play();
                  linesHighlightComponents.push(animation);
                  
                  if (lineToHighlight > 0) {
                    symbolFrame = PIXI.Sprite.from('symbol-frame-' + line.number);
                    symbolFrame.anchor.set(0.5, 0.5);
                    symbol.addChild(symbolFrame);
                    linesHighlightComponents.push(symbolFrame);
                  }
                }
              }
            }
          }
        });

        lineIsBeingHighlighted = true;
      }

      linesHighlightTime += delta * 16.667;

      if (linesHighlightTime >= 1900) {
        if (++lineToHighlight > game.betResponse.win.length) {
          lineToHighlight = 0;
        }

        linesHighlightComponents.forEach((component) => {
          if (!component.destroyed) {
            component.destroy();
          }
        });
        linesHighlightComponents = [];

        lineIsBeingHighlighted = false;
        linesHighlightTime = 0;
      }
    } else {
      if (linesHighlightComponents.length) {
        linesHighlightComponents.forEach((component) => {
          if (!component.destroyed) {
            component.destroy();
          }
        });
        linesHighlightComponents = [];
      }
      
      lineToHighlight = 0;
      linesHighlightTime = 0;
      lineIsBeingHighlighted = false;
    }
  });

  // Start playing theme music
  themeSoundtrack = new Audio(`${assetsUrl}theme.mp3`);
  themeSoundtrack.loop = true;
  themeSoundtrack.volume = 0.2;
  themeSoundtrack.currentTime = 10;
  themeSoundtrack.play();

  console.log('Game setup complete');
}

console.log('Starting game initialization');
initGame().catch(console.error);

game.onDestroy(() => {
  if (themeSoundtrack) {
    themeSoundtrack.pause();
  }
});

window.game = game;
return game;
