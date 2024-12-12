import { notFound } from 'next/navigation';
import Game from '@/components/game/Game';

const VALID_GAMES = ['egyptian-treasures', 'rock-climber'];

interface GamePageProps {
  params: {
    gameId: string;
  };
}

export async function generateStaticParams() {
  return VALID_GAMES.map((gameId) => ({
    gameId,
  }));
}

export default function GamePage({ params }: GamePageProps) {
  if (!VALID_GAMES.includes(params.gameId)) {
    notFound();
  }

  return <Game gameId={params.gameId} />;
}

// Add metadata for each game
export async function generateMetadata({ params }: GamePageProps) {
  const gameId = params.gameId;
  
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
