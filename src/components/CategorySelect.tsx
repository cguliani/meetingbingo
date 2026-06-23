import { Button } from './ui/Button';
import { CATEGORIES } from '../data/categories';
import { useGameContext } from '../context/GameContext';
import type { CategoryId } from '../types';

export function CategorySelect() {
  const { dispatch } = useGameContext();

  const handleSelect = (categoryId: CategoryId) => {
    dispatch({ type: 'START_GAME', categoryId });
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center gap-6 px-4 py-12">
      <div className="flex w-full items-center justify-between">
        <Button variant="ghost" size="md" onClick={() => dispatch({ type: 'GO_HOME' })}>
          ← Back
        </Button>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Choose a category</h1>

      <div className="grid w-full gap-4 sm:grid-cols-3">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => handleSelect(category.id)}
            className="flex flex-col items-start gap-2 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-colors duration-200 hover:border-purple-400 hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          >
            <span className="text-3xl" aria-hidden="true">
              {category.icon}
            </span>
            <span className="text-lg font-semibold text-gray-900">{category.name}</span>
            <span className="text-sm text-gray-600">{category.description}</span>
            <span className="mt-1 text-xs text-gray-500">{category.words.slice(0, 4).join(' • ')}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
