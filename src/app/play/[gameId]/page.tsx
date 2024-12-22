import { notFound } from 'next/navigation';
import Game from '../../../components/game/Game';
import { getGameData } from '../../../lib/api'; // Assume this function fetches game data

const VALID_GAMES = ['egyptian-treasures', 'rock-climber'];

interface GamePageProps {
  params: {
    gameId: string;
  };
}

export default async function GamePage({ params }: GamePageProps) {
  const { gameId } = params;

  if (!VALID_GAMES.includes(gameId)) {
    notFound();
  }

  const gameData = await getGameData(gameId); // Fetch game data directly

  return <Game gameId={gameId} gameData={gameData} />; // Pass gameData to Game component
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
