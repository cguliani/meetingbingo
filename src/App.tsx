import { useGameContext } from './context/GameContext';
import { LandingPage } from './components/LandingPage';
import { CategorySelect } from './components/CategorySelect';
import { GameBoard } from './components/GameBoard';
import { WinScreen } from './components/WinScreen';

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
      return <WinScreen />;
  }
}
