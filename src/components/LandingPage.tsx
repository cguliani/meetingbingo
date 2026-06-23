import { Button } from './ui/Button';
import { useGameContext } from '../context/GameContext';

export function LandingPage() {
  const { dispatch } = useGameContext();

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-8 px-4 py-12 text-center">
      <div>
        <p className="text-5xl" aria-hidden="true">
          🎯
        </p>
        <h1 className="mt-4 text-3xl font-bold text-gray-900 sm:text-4xl">Meeting Bingo</h1>
        <p className="mt-3 text-base text-gray-600">
          Turn buzzword bingo into a game you can play during any meeting.
        </p>
      </div>

      <Button size="lg" onClick={() => dispatch({ type: 'GO_TO_SETUP' })}>
        New Game
      </Button>

      <section className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left text-sm text-gray-600">
        <h2 className="font-semibold text-gray-800">How it works</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Pick a buzzword category.</li>
          <li>Get a 5x5 card of words to listen for.</li>
          <li>Tap a square yourself, or turn on listening to auto-fill it when someone says the word.</li>
          <li>Get 5 in a row, column, or diagonal to win.</li>
        </ol>
      </section>

      <p className="text-xs text-gray-500">
        🔒 If you turn on listening, audio is processed entirely in your browser — nothing is
        recorded or sent anywhere.
      </p>
    </div>
  );
}
