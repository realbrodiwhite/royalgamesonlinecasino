import GameList from '../../src/components/game-list/GameList'; // Importing the GameList component
import Header from '../../src/components/header/Header'; // Importing the Header component

// Home component that serves as the main entry point of the application
export default function Home() {
  return (
    <main>
      <Header /> {/* Render the Header component */}
      <GameList /> {/* Render the GameList component */}
    </main>
  );
}
