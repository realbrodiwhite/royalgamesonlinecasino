'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { Application } from 'pixi.js';
import gsap from 'gsap';
import { socket } from '../../utils/socket';
import styles from './Game.module.css';

// Import game classes
import Reel from '../../slot/Reel';
import SlotGame from '../../slot/SlotGame';
import initControls from '../../slot/initControls';

interface GameProps {
  gameId: string;
}

interface GameInstance {
  app: Application;
  destroy: () => void;
}

// Simplify the GameScript type to avoid circular references
type GameScript = (
  gameId: string,
  Game: unknown,
  Reel: unknown,
  initControls: unknown,
  socket: unknown,
  PIXI: unknown,
  gsap: unknown,
  goToLobby: () => void
) => GameInstance;

const Game = ({ gameId }: GameProps) => {
  const elRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const gameInstanceRef = useRef<GameInstance | null>(null);

  useEffect(() => {
    // Ensure we're in the browser environment
    if (typeof window === 'undefined') return;

    const loadGame = async () => {
      try {
        console.log(`Loading game with ID: ${gameId}`);
        const response = await axios.get(`http://localhost:3001/gamescripts/${gameId}.js`);
        console.log('Game script response:', response.data);
        
        // Import PIXI.js dynamically to ensure it's only loaded in browser
        const PIXI = await import('pixi.js');
        
        const gameScript = new Function(
          'gameId',
          'Game',
          'Reel',
          'initControls',
          'socket',
          'PIXI',
          'gsap',
          'goToLobby',
          response.data
        ) as GameScript;

        // Ensure the container element exists before creating the game
        if (!elRef.current) {
          throw new Error('Game container not found');
        }

        const game = gameScript(
          gameId,
          SlotGame,
          Reel,
          initControls,
          socket,
          PIXI,
          gsap,
          () => router.push('/')
        );
        
        gameInstanceRef.current = game;
        
        // Remove any existing canvas
        const gameCanvas = elRef.current?.querySelector('canvas');
        if (gameCanvas) {
          gameCanvas.remove();
        }

        // Add the new canvas
        if (elRef.current && game.app.canvas) {
          elRef.current.appendChild(game.app.canvas);
          
          // Handle resize
          const resizeGame = () => {
            const parent = game.app.canvas.parentElement;
            if (parent) {
              game.app.renderer.resize(parent.clientWidth, parent.clientHeight);
            }
          };

          window.addEventListener('resize', resizeGame);
          resizeGame(); // Initial resize

          return () => {
            window.removeEventListener('resize', resizeGame);
          };
        }
      } catch (error) {
        console.error('Error loading game:', error);
        router.push('/');
      }
    };

    loadGame();

    return () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy();
        gameInstanceRef.current = null;
      }
    };
  }, [gameId, router]);

  return (
    <div className={styles.gameContainer} ref={elRef}>
      <Link href="/" className={styles.backButton}>
        Back to Lobby
      </Link>
    </div>
  );
}

export default Game;
