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
    const loadGame = async () => {
      try {
        console.log(`Loading game with ID: ${gameId}`);
        const response = await axios.get(`http://localhost:3001/gamescripts/${gameId}.js`);
        console.log('Game script response:', response.data);
        
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

        const game = gameScript(
          gameId,
          SlotGame,
          Reel,
          initControls,
          socket,
          await import('pixi.js'),
          gsap,
          () => router.push('/')
        );
        
        gameInstanceRef.current = game;
        
        const gameCanvas = elRef.current?.querySelector('canvas');
        if (gameCanvas) {
          gameCanvas.remove();
        }

        if (elRef.current && game.app.view) {
          elRef.current.appendChild(game.app.view);
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
