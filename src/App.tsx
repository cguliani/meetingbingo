import { useGameContext } from './context/GameContext';
import { LandingPage } from './components/LandingPage';
import { CategorySelect } from './components/CategorySelect';
import { GameBoard } from './components/GameBoard';

export default function App() {
  const { state } = useGameContext();

  switch (state.status) {
    case 'idle':
      return <LandingPage />;
    case 'setup':
      return <CategorySelect />;
    case 'playing':
      return <GameBoard />;
    case 'won':
      // WinScreen lands in a later step.
      return <div className="p-8 text-center text-gray-500">Win screen coming soon…</div>;
  }
}
