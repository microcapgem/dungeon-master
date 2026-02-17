import { useEffect, useRef } from 'react';
import type { StoryEntry } from '../../game/state';

interface StoryLogProps {
  entries: StoryEntry[];
  streamingText: string;
  isStreaming: boolean;
}

export function StoryLog({ entries, streamingText, isStreaming }: StoryLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries, streamingText]);

  return (
    <div className="story-log">
      {entries.map((entry) => (
        <div key={entry.id} className={`story-entry story-${entry.type}`}>
          {entry.type === 'dm' && <div className="entry-label">Dungeon Master</div>}
          {entry.type === 'player' && <div className="entry-label">You</div>}
          {entry.type === 'roll' && <div className="entry-label">Dice Roll</div>}
          {entry.type === 'system' && <div className="entry-label">System</div>}
          <div className="entry-text">{formatNarrative(entry.text)}</div>
        </div>
      ))}

      {isStreaming && streamingText && (
        <div className="story-entry story-dm streaming">
          <div className="entry-label">Dungeon Master</div>
          <div className="entry-text">{formatNarrative(extractNarrative(streamingText))}</div>
          <span className="typing-indicator" />
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

function extractNarrative(raw: string): string {
  // Try to extract narrative from partial JSON
  const match = raw.match(/"narrative"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (match) return match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');

  // If it looks like it's still building the JSON, try to get partial text
  const partialMatch = raw.match(/"narrative"\s*:\s*"((?:[^"\\]|\\.)*)/);
  if (partialMatch) return partialMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');

  return raw;
}

function formatNarrative(text: string): JSX.Element[] {
  // Simple markdown-like formatting
  const parts = text.split(/(\*[^*]+\*|_[^_]+_)/g);
  return parts.map((part, i) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      return <strong key={i}>{part.slice(1, -1)}</strong>;
    }
    if (part.startsWith('_') && part.endsWith('_')) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return <span key={i}>{part}</span>;
  });
}
