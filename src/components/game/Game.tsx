'use client';

import { useEffect, useRef, useState } from 'react';
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

interface LoginResponse {
  status: 'logged-in' | 'error';
  key?: string;
  username?: string;
  balance?: number;
  message?: string;
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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ensure we're in the browser environment
    if (typeof window === 'undefined') return;

    const loadGame = async () => {
      try {
        console.log(`Loading game with ID: ${gameId}`);
        setLoading(true);
        setError(null);

        // Check if socket is connected
        if (!socket.connected) {
          console.log('Socket not connected, attempting to connect...');
          socket.connect();
        }

        // Emit login event if no key exists
        const key = localStorage.getItem('key');
        if (!key) {
          console.log('No key found, logging in as guest...');
          socket.emit('login', { key: null });
        }

        // Wait for login response
        await new Promise((resolve, reject) => {
          socket.once('login', (data: LoginResponse) => {
            if (data.status === 'logged-in') {
              console.log('Login successful:', data);
              resolve(data);
            } else {
              console.error('Login failed:', data);
              reject(new Error(data.message || 'Login failed'));
            }
          });

          // Add timeout
          setTimeout(() => reject(new Error('Login timeout')), 5000);
        });

        // Use the rewrite rule path instead of direct server URL
        console.log('Fetching game script...');
        const response = await axios.get(`/gamescripts/${gameId}.js`);
        console.log('Game script loaded successfully');
        
        // Import PIXI.js dynamically to ensure it's only loaded in browser
        console.log('Loading PIXI.js...');
        const PIXI = await import('pixi.js');
        console.log('PIXI.js loaded successfully');
        
        // Ensure the container element exists before creating the game
        if (!elRef.current) {
          throw new Error('Game container not found');
        }

        console.log('Creating game script...');
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

        // Create and initialize the game instance
        console.log('Initializing game...');
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

        // Store the game instance
        gameInstanceRef.current = game;

        // Wait for the game to be fully initialized
        if (game.app) {
          console.log('Game initialized successfully');
          
          // Remove any existing canvas
          const existingCanvas = elRef.current.querySelector('canvas');
          if (existingCanvas) {
            existingCanvas.remove();
          }

          // Add the new canvas only after the game is initialized
          if (game.app.canvas) {
            elRef.current.appendChild(game.app.canvas);

            // Handle resize
            const resizeGame = () => {
              const parent = game.app.canvas?.parentElement;
              if (parent && game.app.renderer) {
                game.app.renderer.resize(parent.clientWidth, parent.clientHeight);
              }
            };

            window.addEventListener('resize', resizeGame);
            resizeGame(); // Initial resize
            setLoading(false);

            return () => {
              window.removeEventListener('resize', resizeGame);
            };
          }
        }
      } catch (error) {
        console.error('Error loading game:', error);
        setError(error instanceof Error ? error.message : 'Failed to load game');
        setLoading(false);
      }
    };

    loadGame();

    // Cleanup function
    return () => {
      if (gameInstanceRef.current) {
        try {
          gameInstanceRef.current.destroy();
          gameInstanceRef.current = null;
        } catch (error) {
          console.error('Error destroying game:', error);
        }
      }
    };
  }, [gameId, router]);

  return (
    <div className={styles.gameContainer} ref={elRef}>
      <Link href="/" className={styles.backButton}>
        Back to Lobby
      </Link>
      {loading && <div className={styles.loading}>Loading...</div>}
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}

export default Game;
