import { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { ELEVEN_LABS_VOICES } from '../../utils/voice';
import type { ProviderType } from '../../ai/provider';

interface AISettingsProps {
  onClose: () => void;
}

export function AISettings({ onClose }: AISettingsProps) {
  const { settings, updateSettings } = useGame();

  // All settings as local state — only saved when clicking Save
  const [provider, setProvider] = useState<ProviderType>(settings.providerType);
  const [claudeKey, setClaudeKey] = useState(settings.claudeApiKey);
  const [openaiKey, setOpenaiKey] = useState(settings.openaiApiKey);
  const [openaiModel, setOpenaiModel] = useState(settings.openaiModel);
  const [elevenKey, setElevenKey] = useState(settings.elevenLabsApiKey);
  const [elevenVoice, setElevenVoice] = useState(settings.elevenLabsVoiceId);
  const [showMechanics, setShowMechanics] = useState(settings.showMechanics);

  const save = () => {
    updateSettings({
      providerType: provider,
      claudeApiKey: claudeKey,
      openaiApiKey: openaiKey,
      openaiModel,
      elevenLabsApiKey: elevenKey,
      elevenLabsVoiceId: elevenVoice,
      showMechanics,
    });
    onClose();
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <button className="overlay-close" onClick={onClose}>{'\u2715'}</button>
        <h2>Dungeon Master Settings</h2>

        <div className="settings-section">
          <label className="settings-label">DM Brain</label>
          <div className="provider-toggle">
            <button
              className={`toggle-btn ${provider === 'claude' ? 'active' : ''}`}
              onClick={() => setProvider('claude')}
            >
              Claude (Anthropic)
            </button>
            <button
              className={`toggle-btn ${provider === 'openai' ? 'active' : ''}`}
              onClick={() => setProvider('openai')}
            >
              OpenAI (GPT)
            </button>
          </div>
        </div>

        {provider === 'claude' && (
          <div className="settings-section">
            <label className="settings-label">Anthropic API Key</label>
            <input
              type="password"
              className="settings-input"
              value={claudeKey}
              onChange={(e) => setClaudeKey(e.target.value)}
              placeholder="sk-ant-..."
            />
            <small className="settings-hint">Your key is stored locally and never sent to any server except Anthropic's API.</small>
          </div>
        )}

        {provider === 'openai' && (
          <>
            <div className="settings-section">
              <label className="settings-label">OpenAI API Key</label>
              <input
                type="password"
                className="settings-input"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="sk-..."
              />
              <small className="settings-hint">Your key is stored locally and never sent to any server except OpenAI's API.</small>
            </div>
            <div className="settings-section">
              <label className="settings-label">Model</label>
              <input
                className="settings-input"
                value={openaiModel}
                onChange={(e) => setOpenaiModel(e.target.value)}
                placeholder="gpt-5.2"
              />
              <small className="settings-hint">Recommended: gpt-5.2, gpt-5.2-pro, or gpt-5.3-codex</small>
            </div>
          </>
        )}

        <div className="settings-divider"></div>

        <div className="settings-section">
          <label className="settings-label" style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showMechanics}
              onChange={(e) => setShowMechanics(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--accent-purple)' }}
            />
            Show Game Mechanics
          </label>
          <small className="settings-hint">
            When enabled, the DM calls for rolls, references AC, and runs combat like a real tabletop session. When off, the story stays purely narrative — mechanics happen behind the scenes.
          </small>
        </div>

        <div className="settings-divider"></div>

        <div className="settings-section">
          <label className="settings-label">DM Voice</label>
          <small className="settings-hint" style={{ marginBottom: '8px', display: 'block' }}>
            Optional. Add an ElevenLabs API key for cinematic AI narration. Without it, the browser's built-in voice is used.
          </small>
          <input
            type="password"
            className="settings-input"
            value={elevenKey}
            onChange={(e) => setElevenKey(e.target.value)}
            placeholder="ElevenLabs API key (optional)"
          />
          <small className="settings-hint">
            Free tier: ~10,000 characters/month.{' '}
            <a href="https://elevenlabs.io" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-purple)' }}>
              Get a key
            </a>
          </small>
        </div>

        {elevenKey && (
          <div className="settings-section">
            <label className="settings-label">Voice</label>
            <div className="voice-group-label">Male</div>
            <div className="voice-options">
              {ELEVEN_LABS_VOICES.slice(0, 6).map(v => (
                <button
                  key={v.id}
                  className={`voice-chip ${elevenVoice === v.id ? 'active' : ''}`}
                  onClick={() => setElevenVoice(v.id)}
                >
                  <span className="voice-chip-name">{v.name}</span>
                  <span className="voice-chip-desc">{v.desc}</span>
                </button>
              ))}
            </div>
            <div className="voice-group-label" style={{ marginTop: '12px' }}>Female</div>
            <div className="voice-options">
              {ELEVEN_LABS_VOICES.slice(6).map(v => (
                <button
                  key={v.id}
                  className={`voice-chip ${elevenVoice === v.id ? 'active' : ''}`}
                  onClick={() => setElevenVoice(v.id)}
                >
                  <span className="voice-chip-name">{v.name}</span>
                  <span className="voice-chip-desc">{v.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="settings-actions">
          <button className="btn-primary" onClick={save}>Save</button>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
