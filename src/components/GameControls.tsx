import { Button } from './ui/Button';

interface Props {
  isListening: boolean;
  isSpeechSupported: boolean;
  onNewCard: () => void;
  onToggleListening: () => void;
}

export function GameControls({ isListening, isSpeechSupported, onNewCard, onToggleListening }: Props) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
      <Button variant="secondary" onClick={onNewCard}>
        New Card
      </Button>
      <Button
        variant={isListening ? 'secondary' : 'primary'}
        onClick={onToggleListening}
        disabled={!isSpeechSupported}
        title={!isSpeechSupported ? 'Speech recognition is not supported in this browser' : undefined}
      >
        {isListening ? 'Stop Listening' : 'Start Listening'}
      </Button>
    </div>
  );
}
