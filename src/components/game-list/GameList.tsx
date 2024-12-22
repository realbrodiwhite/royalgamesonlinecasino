import { useState } from 'react'; // Importing useState hook for state management
import Link from 'next/link'; // Importing Link for client-side navigation
import Image from 'next/image'; // Importing Image for optimized image rendering
import dynamic from 'next/dynamic'; // Import dynamic for dynamic imports
import styles from './GameList.module.css'; // Importing CSS module for styling

// Dynamically import AccountsModal
const AccountsModal = dynamic(() => import('../accounts/AccountsModal'), { ssr: false });

// Function to fetch games data (to be implemented)
const fetchGamesData = async () => {
  // Implement the logic to fetch game data from an API or server-side source
  return [
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
};

// GameList component to display a list of games
const GameList = async () => {
  const games = await fetchGamesData(); // Fetch games data

  const [showAccountsModal, setShowAccountsModal] = useState(false); // State to control AccountsModal visibility

  const handlePlayClick = (e: React.MouseEvent) => {
    // Logic to handle play button clicks
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