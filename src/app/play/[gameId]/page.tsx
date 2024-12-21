import { notFound } from 'next/navigation';
import Game from '../../../components/game/Game';

const VALID_GAMES = ['egyptian-treasures', 'rock-climber'];

interface GamePageProps {
  params: {
    gameId: string;
  };
}

export async function getStaticProps({ params }: GamePageProps) {
  const { gameId } = params;

  // Fetch any necessary game data here
  const gameData = await fetchGameData(gameId); // Implement this function to fetch game data

  return {
    props: {
      gameData,
    },
  };
}

export async function getStaticPaths() {
  return VALID_GAMES.map((gameId) => ({
    gameId,
  }));
}

export default function GamePage({ params }: GamePageProps) {
  const { gameId } = params; // Directly access params without await
  
  if (!VALID_GAMES.includes(gameId)) {
    notFound();
  }

  return <Game gameId={gameId} />;
}

// Add metadata for each game
export async function generateMetadata({ params }: GamePageProps) {
  const { gameId } = params;
  
  const titles: Record<string, string> = {
    'egyptian-treasures': 'Egyptian Treasures - Sloticon',
    'rock-climber': 'Rock Climber - Sloticon',
  };

  const descriptions: Record<string, string> = {
    'egyptian-treasures': 'Explore the riches of ancient Egypt in this exciting slot machine game',
    'rock-climber': 'Climb to new heights and discover treasures in this thrilling slot machine game',
  };

  return {
    title: titles[gameId] || 'Play Game - Sloticon',
    description: descriptions[gameId] || 'Play exciting slot machine games on Sloticon',
  };
}
