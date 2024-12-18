'use client'; // Indicates that this component is a client component

import { useState } from 'react'; // Importing useState hook for state management
import { useSelector } from 'react-redux'; // Importing useSelector to access Redux state
import Link from 'next/link'; // Importing Link for client-side navigation
import Image from 'next/image'; // Importing Image for optimized image rendering
import { RootState } from '../../store/store'; // Importing RootState type for TypeScript
import AccountsModal from '../accounts/AccountsModal'; // Importing AccountsModal component
import styles from './GameList.module.css'; // Importing CSS module for styling

// GameList component to display a list of games
const GameList = () => {
  const loggedIn = useSelector((state: RootState) => state.lobby.loggedIn); // Accessing logged-in state from Redux
  const [showAccountsModal, setShowAccountsModal] = useState(false); // State to control AccountsModal visibility

  // Array of games to be displayed
  const games = [
    {
      id: 'egyptian-treasures',
      title: 'Egyptian Treasures',
      logo: '/data/egyptian-treasures/logo-spritesheet.png',
      dimensions: { width: 200, height: 100 }
    },
    {
      id: 'rock-climber',
      title: 'Rock Climber',
      logo: '/data/rock-climber/logo-animation-spritesheet.png',
      dimensions: { width: 200, height: 100 }
    }
  ];

  // Function to handle play button clicks
  const handlePlayClick = (e: React.MouseEvent) => {
    if (!loggedIn) {
      e.preventDefault(); // Prevent default link behavior if not logged in
      setShowAccountsModal(true); // Show the AccountsModal
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

export default GameList; // Exporting the GameList component
