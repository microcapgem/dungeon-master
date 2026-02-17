import { useState, useRef, useEffect } from 'react';

interface ActionInputProps {
  onSubmit: (action: string) => void;
  disabled: boolean;
  suggestedActions: string[];
}

export function ActionInput({ onSubmit, disabled, suggestedActions }: ActionInputProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled]);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="action-input-container">
      {suggestedActions.length > 0 && (
        <div className="suggested-actions">
          {suggestedActions.map((action, i) => (
            <button
              key={i}
              className="suggested-action-btn"
              onClick={() => onSubmit(action)}
              disabled={disabled}
            >
              {action}
            </button>
          ))}
        </div>
      )}
      <div className="input-row">
        <textarea
          ref={inputRef}
          className="action-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'The DM is narrating...' : 'What do you do? (Enter to send)'}
          disabled={disabled}
          rows={2}
        />
        <button
          className="send-btn"
          onClick={handleSubmit}
          disabled={disabled || !text.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
