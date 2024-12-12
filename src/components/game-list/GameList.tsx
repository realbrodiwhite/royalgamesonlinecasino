'use client';

import { useSelector } from 'react-redux';
import Link from 'next/link';
import Image from 'next/image';
import { RootState } from '@/store/store';
import styles from './GameList.module.css';

const GameList = () => {
  const loggedIn = useSelector((state: RootState) => state.lobby.loggedIn);

  const games = [
    {
      id: 'egyptian-treasures',
      title: 'Egyptian Treasures',
      logo: '/data/egyptian-treasures/logo-spritesheet.png'
    },
    {
      id: 'rock-climber',
      title: 'Rock Climber',
      logo: '/data/rock-climber/logo-animation-spritesheet.png'
    }
  ];

  console.log('GameList rendered with games:', games);
  console.log('User logged in status:', loggedIn);

  return (
    <div className={styles.gameList}>
      <div className={`${styles.list} ${!loggedIn ? styles.hidden : ''}`}>
        {games.map((game) => (
          <div key={game.id} className={styles.game}>
            <Image
              className={styles.logo}
              src={game.logo}
              alt={`${game.title} Logo`}
              width={200}
              height={100}
              priority
            />
            
            <span className={styles.gameTitle}>{game.title}</span>

            <Link href={`/play/${game.id}`} className={styles.playButton}>
              Play
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GameList;