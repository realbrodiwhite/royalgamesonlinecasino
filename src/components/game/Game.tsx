import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic'; // Import dynamic for dynamic imports
import Image from 'next/image'; // Import Next.js Image component
import useSocket from '../../hooks/useSocket'; // Import the custom hook
import { fetchGameData } from '../../utils/fetchGameData'; // Import the fetch function
import styles from './Game.module.css'; // Import styles

// Dynamically import SlotGame
const SlotGame = dynamic(() => import('../../slot/SlotGame'), { ssr: false });

interface GameProps {
  gameId: string;
}

const Game = ({ gameId }: GameProps) => {
  const elRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const socket = useSocket(gameId); // Use the custom socket hook to get the socket instance

  useEffect(() => {
    const loadGame = async () => {
      try {
        console.log(`Loading game with ID: ${gameId}`);
        setLoading(true);
        setError(null);

        // Fetch game data
        const gameData = await fetchGameData(gameId);
        console.log('Game data loaded successfully:', gameData);

        // Ensure the container element exists before creating the game
        if (!elRef.current) {
          throw new Error('Game container not found');
        }

        // Create a GameConfig object
        const gameConfig = {
          id: gameId,
          width: 800,
          height: 600,
          reelsCount: 5,
          reelPositions: 3,
          symbolsCount: 10,
          hasBlurredSymbols: false,
          symbolMargin: 10,
          maskPaddingX: 20,
          maskPaddingY: 20,
          reelsSpeed: 5,
          spinTimeBetweenReels: 100,
        };

        // Create and initialize the game instance
        const game = new SlotGame(gameConfig, socket);

        // Wait for the game to be fully initialized
        await game.init();

        if (game.app) {
          console.log('Game initialized successfully');
          elRef.current.appendChild(game.app.canvas);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading game:', error);
        handleError(error instanceof Error ? error.message : 'Failed to load game');
      }
    };

    const handleError = (errorMessage: string) => {
      setError(errorMessage);
      setLoading(false);
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying... Attempt ${retryCount + 1} of ${MAX_RETRIES}`);
        setTimeout(loadGame, 2000); // Retry after 2 seconds
        setRetryCount(prev => prev + 1);
      }
    };

    loadGame();

    // Cleanup function
    return () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy();
        gameInstanceRef.current = null;
      }
    };
  }, [gameId, router, retryCount, socket]);

  return (
    <div className={styles.gameContainer} ref={elRef}>
      <Link href="/" className={styles.backButton}>
        Back to Lobby
      </Link>
      {loading && <div className={styles.loading}>Loading...</div>} 
      <Image
        src="/data/egyptian-treasures/egyptian-treasures-logo.png"
        alt="Egyptian Treasures Logo"
        width={200}
        height={100}
        priority
      />
      {error && (
        <div className={styles.error}>
          {error}
          {retryCount >= MAX_RETRIES && (
            <button onClick={() => setRetryCount(0)} className={styles.retryButton}>
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default Game;

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Application } from 'pixi.js';
import Image from 'next/image'; // Import Next.js Image component
import useSocket from '../../hooks/useSocket'; // Import the custom hook
import { fetchGameData } from '../../utils/fetchGameData'; // Import the fetch function
import styles from './Game.module.css'; // Import styles

// Import game classes
import SlotGame from '../../slot/SlotGame';

interface GameProps {
  gameId: string;
}

interface GameInstance {
  app: Application;
  destroy: () => void;
}

const Game = ({ gameId }: GameProps) => {
  const elRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const gameInstanceRef = useRef<GameInstance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const socket = useSocket(gameId); // Use the custom socket hook to get the socket instance

  useEffect(() => {
    const loadGame = async () => {
      try {
        console.log(`Loading game with ID: ${gameId}`);
        setLoading(true);
        setError(null);

        // Fetch game data
        const gameData = await fetchGameData(gameId);
        console.log('Game data loaded successfully:', gameData);

        // Ensure the container element exists before creating the game
        if (!elRef.current) {
          throw new Error('Game container not found');
        }

        // Create a GameConfig object
        const gameConfig = {
          id: gameId,
          width: 800, // Set appropriate width
          height: 600, // Set appropriate height
          reelsCount: 5, // Set appropriate number of reels
          reelPositions: 3, // Set appropriate number of positions
          symbolsCount: 10, // Set appropriate number of symbols
          hasBlurredSymbols: false,
          symbolMargin: 10,
          maskPaddingX: 20,
          maskPaddingY: 20,
          reelsSpeed: 5,
          spinTimeBetweenReels: 100,
        };

        // Create and initialize the game instance
        const game = new SlotGame(gameConfig, socket); // Pass the correct parameters

        // Store the game instance
        gameInstanceRef.current = game;

        // Wait for the game to be fully initialized
        await game.init(); // Ensure to call init to set up the game

        if (game.app) {
          console.log('Game initialized successfully');
          elRef.current.appendChild(game.app.canvas);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading game:', error);
        handleError(error instanceof Error ? error.message : 'Failed to load game');
      }
    };

    const handleError = (errorMessage: string) => {
      setError(errorMessage);
      setLoading(false);
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying... Attempt ${retryCount + 1} of ${MAX_RETRIES}`);
        setTimeout(loadGame, 2000); // Retry after 2 seconds
        setRetryCount(prev => prev + 1);
      }
    };

    loadGame();

    // Cleanup function
    return () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy();
        gameInstanceRef.current = null;
      }
      // Clean up socket event listeners
    };
  }, [gameId, router, retryCount, socket]);

  return (
    <div className={styles.gameContainer} ref={elRef}>
      <Link href="/" className={styles.backButton}>
        Back to Lobby
      </Link>
      {loading && <div className={styles.loading}>Loading...</div>} 
      <Image
        src="/data/egyptian-treasures/egyptian-treasures-logo.png"
        alt="Egyptian Treasures Logo"
        width={200}
        height={100}
        priority // Optional: Use priority for important images
      />
      {error && (
        <div className={styles.error}>
          {error}
          {retryCount >= MAX_RETRIES && (
            <button onClick={() => setRetryCount(0)} className={styles.retryButton}>
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default Game;
