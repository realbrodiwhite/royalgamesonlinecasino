'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { Application } from 'pixi.js';
import gsap from 'gsap';
import styles from './Game.module.css';

// Import game classes
import Reel from '@/slot/Reel';
import SlotGame from '@/slot/SlotGame';
import initControls from '@/slot/initControls';

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

  useEffect(() => {
    const loadGame = async () => {
      try {
        console.log(`Loading game with ID: ${gameId}`);
        const response = await axios.get(`/gamescripts/${gameId}.js`);
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
        ) as (
          gameId: string,
          Game: typeof SlotGame,
          Reel: typeof Reel,
          initControls: typeof initControls,
          socket: null,
          PIXI: typeof import('pixi.js'),
          gsap: typeof import('gsap'),
          goToLobby: () => void
        ) => GameInstance;

        const game = gameScript(
          gameId,
          SlotGame,
          Reel,
          initControls,
          null,
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