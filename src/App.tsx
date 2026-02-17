import { useState } from 'react';
import { useGame } from './context/GameContext';
import { GameScreen } from './components/GameScreen';
import { QuickPresets } from './components/CharacterCreation/QuickPresets';
import { RandomCharacter } from './components/CharacterCreation/RandomCharacter';
import { CustomCreator } from './components/CharacterCreation/CustomCreator';
import { AISettings } from './components/Settings/AISettings';
import { SaveLoad } from './components/SaveLoad';
import { QuestExport } from './components/QuestExport';
import { isVoiceEnabled, setVoiceEnabled, stopSpeaking } from './utils/voice';
import { listSaves } from './utils/storage';
import './App.css';

function AppContent() {
  const { state, dispatch, settings } = useGame();
  const [showSettings, setShowSettings] = useState(false);
  const [showSaveLoad, setShowSaveLoad] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [voiceOn, setVoiceOn] = useState(isVoiceEnabled());

  const isConfigured = settings.providerType === 'claude'
    ? settings.claudeApiKey.length > 0
    : settings.openaiApiKey.length > 0;
  const hasSaves = listSaves().length > 0;

  const toggleVoice = () => {
    const next = !voiceOn;
    setVoiceOn(next);
    setVoiceEnabled(next);
    if (!next) stopSpeaking();
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <h1 className="app-title">
          <span className="title-icon">{'\u{1F409}'}</span>
          Dungeon Master
        </h1>
        <nav className="header-nav">
          {(state.phase === 'playing' || state.phase === 'combat') && (
            <button
              className={`nav-btn voice-btn ${voiceOn ? 'voice-on' : ''}`}
              onClick={toggleVoice}
              title={voiceOn ? 'Mute DM voice' : 'Enable DM voice'}
            >
              {voiceOn ? '\u{1F50A} Voice' : '\u{1F507} Muted'}
            </button>
          )}
          {(state.phase === 'playing' || state.phase === 'combat' || hasSaves) && (
            <button className="nav-btn save-btn" onClick={() => setShowSaveLoad(true)}>
              Save/Load
            </button>
          )}
          {(state.phase === 'playing' || state.phase === 'combat') && state.storyLog.length > 2 && (
            <button className="nav-btn export-btn" onClick={() => setShowExport(true)}>
              Export Quest
            </button>
          )}
          {state.phase !== 'setup' && state.phase !== 'character-select' && (
            <button className="nav-btn" onClick={() => {
              if (confirm('Start a new adventure? Current progress will be lost.')) {
                stopSpeaking();
                dispatch({ type: 'NEW_GAME' });
                dispatch({ type: 'SET_PHASE', phase: 'setup' });
              }
            }}>
              New Game
            </button>
          )}
          <button className="nav-btn settings-btn" onClick={() => setShowSettings(true)}>
            Settings
          </button>
        </nav>
      </header>

      {/* Main content based on phase */}
      {state.phase === 'setup' && (
        <div className="setup-screen">
          <div className="hero-section">
            <h2 className="hero-title">Welcome, Adventurer</h2>
            <p className="hero-subtitle">
              Your story awaits. The Dungeon Master will guide you through
              a world of magic, danger, and discovery.
            </p>

            {!isConfigured && (
              <div className="config-warning">
                <p>Before you begin, configure your Dungeon Master in Settings.</p>
                <button className="btn-primary" onClick={() => setShowSettings(true)}>
                  Open Settings
                </button>
              </div>
            )}

            {isConfigured && (
              <div className="start-options">
                <button
                  className="btn-primary btn-large"
                  onClick={() => dispatch({ type: 'SET_PHASE', phase: 'character-select' })}
                >
                  Begin Your Adventure
                </button>
                {hasSaves && (
                  <button
                    className="btn-secondary btn-large"
                    style={{ marginLeft: '16px' }}
                    onClick={() => setShowSaveLoad(true)}
                  >
                    Load Save
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="feature-cards">
            <div className="feature-card">
              <span className="feature-icon">{'\u{1F9D9}'}</span>
              <h3>Dungeon Master</h3>
              <p>A creative DM that adapts to your choices</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">{'\u{1F50A}'}</span>
              <h3>Voice Narration</h3>
              <p>Hear the DM speak your adventure aloud</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">{'\u2694\uFE0F'}</span>
              <h3>Combat & Magic</h3>
              <p>Simplified D&D rules that are easy to learn</p>
            </div>
          </div>
        </div>
      )}

      {state.phase === 'character-select' && (
        <CharacterSelectScreen />
      )}

      {(state.phase === 'playing' || state.phase === 'combat') && (
        <GameScreen />
      )}

      {/* Modals */}
      {showSettings && <AISettings onClose={() => setShowSettings(false)} />}
      {showSaveLoad && <SaveLoad onClose={() => setShowSaveLoad(false)} />}
      {showExport && <QuestExport onClose={() => setShowExport(false)} />}
    </div>
  );
}

type CreateMode = 'presets' | 'random' | 'custom';

function CharacterSelectScreen() {
  const [mode, setMode] = useState<CreateMode>('presets');

  return (
    <div className="character-select-screen">
      <h2>Create Your Hero</h2>
      <div className="create-mode-tabs">
        <button
          className={`create-mode-tab ${mode === 'presets' ? 'active' : ''}`}
          onClick={() => setMode('presets')}
        >
          Quick Presets
        </button>
        <button
          className={`create-mode-tab ${mode === 'random' ? 'active' : ''}`}
          onClick={() => setMode('random')}
        >
          Random
        </button>
        <button
          className={`create-mode-tab ${mode === 'custom' ? 'active' : ''}`}
          onClick={() => setMode('custom')}
        >
          Custom
        </button>
      </div>

      {mode === 'presets' && (
        <>
          <p className="select-subtitle">Pick a pre-made character and jump straight into the action.</p>
          <QuickPresets />
        </>
      )}
      {mode === 'random' && (
        <>
          <p className="select-subtitle">Fate decides your hero. Re-roll until you find one you like.</p>
          <RandomCharacter />
        </>
      )}
      {mode === 'custom' && (
        <>
          <p className="select-subtitle">Build your character from scratch — race, class, abilities, and backstory.</p>
          <CustomCreator />
        </>
      )}
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
