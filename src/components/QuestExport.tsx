import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { ClaudeProvider } from '../ai/claude';
import { OpenAIProvider } from '../ai/openai';

interface QuestExportProps {
  onClose: () => void;
}

export function QuestExport({ onClose }: QuestExportProps) {
  const { state, settings } = useGame();
  const [story, setStory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const generateStory = async () => {
    setLoading(true);
    setError('');
    setStory('');

    // Build a condensed version of the adventure log
    const logSummary = state.storyLog
      .filter(e => e.type === 'dm' || e.type === 'player')
      .map(e => e.type === 'player' ? `[PLAYER ACTION]: ${e.text}` : e.text)
      .join('\n\n');

    const char = state.character;
    const charInfo = char
      ? `Character: ${char.name}, a level ${char.level} ${char.race} ${char.class}. ${char.backstory || ''}`
      : 'Unknown adventurer';

    const prompt = `You are a skilled fantasy author. Below is the raw adventure log from a D&D session. Rewrite it as a compelling short story — a self-contained tale with vivid prose, dialogue, and dramatic pacing.

CHARACTER:
${charInfo}

LOCATIONS VISITED: ${state.location}
QUESTS: ${state.questLog.join(', ') || 'None recorded'}
NPCs MET: ${state.npcsMetNames.join(', ') || 'None recorded'}

ADVENTURE LOG:
${logSummary}

INSTRUCTIONS:
- Write in third person past tense
- Give it a title
- Make it feel like a chapter from a fantasy novel
- Include the key moments, battles, and decisions
- Keep it under 1500 words
- End with a sense of the adventure continuing (or concluding, if it ended)`;

    try {
      const provider = settings.providerType === 'claude'
        ? new ClaudeProvider(settings.claudeApiKey)
        : new OpenAIProvider(settings.openaiApiKey, settings.openaiModel);

      if (!provider.isConfigured()) {
        setError('AI provider not configured. Check your settings.');
        setLoading(false);
        return;
      }

      let fullText = '';
      for await (const chunk of provider.streamMessage(
        [{ role: 'user', content: prompt }],
        'You are a fantasy author who writes vivid, engaging prose. You take D&D adventure logs and turn them into beautiful short stories.',
        4096
      )) {
        fullText += chunk;
        setStory(fullText);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate story');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(story);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const charName = state.character?.name || 'Adventure';
    const blob = new Blob([story], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${charName.replace(/\s+/g, '_')}_Quest.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="export-panel" onClick={e => e.stopPropagation()}>
        <button className="overlay-close" onClick={onClose}>{'\u2715'}</button>

        <h2 className="export-title">Export Your Quest</h2>
        <p className="export-subtitle">
          The Dungeon Master will retell your adventure as an epic tale.
        </p>

        {!story && !loading && (
          <div className="export-start">
            <div className="export-preview">
              <div className="export-stat">
                <span className="export-stat-label">Hero</span>
                <span className="export-stat-value">{state.character?.name || 'Unknown'}</span>
              </div>
              <div className="export-stat">
                <span className="export-stat-label">Entries</span>
                <span className="export-stat-value">{state.storyLog.length}</span>
              </div>
              <div className="export-stat">
                <span className="export-stat-label">Quests</span>
                <span className="export-stat-value">{state.questLog.length || 'None'}</span>
              </div>
              <div className="export-stat">
                <span className="export-stat-label">NPCs Met</span>
                <span className="export-stat-value">{state.npcsMetNames.length || 'None'}</span>
              </div>
            </div>
            <button className="btn-primary btn-large export-generate-btn" onClick={generateStory}>
              Write My Story
            </button>
          </div>
        )}

        {loading && (
          <div className="export-loading">
            <div className="export-quill"></div>
            <p>The Dungeon Master is writing your tale...</p>
          </div>
        )}

        {error && <div className="export-error">{error}</div>}

        {story && (
          <div className="export-result">
            <div className="export-story">{story}</div>
            <div className="export-actions">
              <button className="btn-primary" onClick={handleCopy}>
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
              <button className="btn-secondary" onClick={handleDownload}>
                Download .txt
              </button>
              {!loading && (
                <button className="btn-secondary" onClick={generateStory}>
                  Regenerate
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
