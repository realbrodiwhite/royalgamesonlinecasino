'use client';

import { useState } from 'react';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import Image from 'next/image';
import { RootState } from '../../store/store';
import AccountsModal from '../accounts/AccountsModal';
import styles from './GameList.module.css';

const GameList = () => {
  const loggedIn = useSelector((state: RootState) => state.lobby.loggedIn);
  const [showAccountsModal, setShowAccountsModal] = useState(false);

  const games = [
    {
      id: 'egyptian-treasures',
      title: 'Egyptian Treasures',
      logo: '/data/egyptian-treasures/egyptian-treasures-logo.png',
      dimensions: { width: 200, height: 100 }
    },
    {
      id: 'rock-climber',
      title: 'Rock Climber',
      logo: '/data/rock-climber/rock-climber-logo.png',
      dimensions: { width: 200, height: 100 }
    }
  ];

  const handlePlayClick = (e: React.MouseEvent) => {
    if (!loggedIn) {
      e.preventDefault();
      setShowAccountsModal(true);
    }
  };

  return (
    <div className={styles.gameList}>
      <div className={styles.list}>
        {games.map((game) => (
          <div key={game.id} className={styles.game}>
            <div className={styles.logoWrapper}>
              <Image
                className={styles.logo}
                src={`${process.env.NEXT_PUBLIC_GAME_SERVER_URL || 'http://localhost:3001'}${game.logo}`}
                alt={`${game.title} Logo`}
                width={game.dimensions.width}
                height={game.dimensions.height}
                style={{ objectFit: 'contain' }}
                priority
                unoptimized
              />
            </div>
            
            <span className={styles.gameTitle}>{game.title}</span>

            <Link 
              href={`/play/${game.id}`} 
              className={styles.playButton}
              onClick={handlePlayClick}
            >
              Play
            </Link>
          </div>
        ))}
      </div>

      <AccountsModal 
        isOpen={showAccountsModal} 
        onClose={() => setShowAccountsModal(false)} 
      />
    </div>
  );
}

export default GameList;
