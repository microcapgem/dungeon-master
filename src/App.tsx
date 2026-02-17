import { useState } from 'react';
import { useGame } from './context/GameContext';
import { GameScreen } from './components/GameScreen';
import { QuickPresets } from './components/CharacterCreation/QuickPresets';
import { RandomCharacter } from './components/CharacterCreation/RandomCharacter';
import { CustomCreator } from './components/CharacterCreation/CustomCreator';
import { AISettings } from './components/Settings/AISettings';
import { SaveLoad } from './components/SaveLoad';
import { QuestExport } from './components/QuestExport';
import { CharacterHistory } from './components/CharacterHistory';
import { isVoiceEnabled, setVoiceEnabled, stopSpeaking } from './utils/voice';
import { listSaves, loadRoster, deleteRosterCharacter } from './utils/storage';
import type { RosterCharacter } from './game/state';
import './App.css';

function AppContent() {
  const { state, dispatch, settings, endCampaign, isAIResponding } = useGame();
  const [showSettings, setShowSettings] = useState(false);
  const [showSaveLoad, setShowSaveLoad] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [voiceOn, setVoiceOn] = useState(isVoiceEnabled());

  const isConfigured = settings.providerType === 'claude'
    ? settings.claudeApiKey.length > 0
    : settings.openaiApiKey.length > 0;
  const hasSaves = listSaves().length > 0;
  const isInGame = state.phase === 'playing' || state.phase === 'combat';

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
          {isInGame && (
            <button
              className={`nav-btn voice-btn ${voiceOn ? 'voice-on' : ''}`}
              onClick={toggleVoice}
              title={voiceOn ? 'Mute DM voice' : 'Enable DM voice'}
            >
              {voiceOn ? '\u{1F50A}' : '\u{1F507}'}
            </button>
          )}
          {(isInGame || hasSaves) && (
            <button className="nav-btn save-btn" onClick={() => setShowSaveLoad(true)}>
              Saves
            </button>
          )}
          {isInGame && (
            <button className="nav-btn export-btn" onClick={() => setShowExport(true)}>
              Export
            </button>
          )}
          {isInGame && (
            <button
              className="nav-btn end-campaign-btn"
              disabled={isAIResponding}
              onClick={() => {
                if (confirm('End this campaign? Your character and adventure will be saved to the roster for future campaigns.')) {
                  stopSpeaking();
                  endCampaign();
                }
              }}
            >
              End Campaign
            </button>
          )}
          {isInGame && (
            <button className="nav-btn" onClick={() => {
              if (confirm('Start a new adventure? Current progress will be lost unless you end the campaign first.')) {
                stopSpeaking();
                dispatch({ type: 'NEW_GAME' });
                dispatch({ type: 'SET_PHASE', phase: 'setup' });
              }
            }}>
              New
            </button>
          )}
          <button className="nav-btn settings-btn" onClick={() => setShowSettings(true)}>
            {'\u2699'}
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

      {state.phase === 'game-over' && state.character && (
        <div className="game-over-screen">
          <div className="game-over-content">
            <h2 className="game-over-title">Fallen in Battle</h2>
            <p className="game-over-name">{state.character.name}</p>
            <p className="game-over-details">
              Level {state.character.level} {state.character.race} {state.character.class}
            </p>
            <p className="game-over-epitaph">
              The darkness closes in. Your story ends here — but legends never truly die.
            </p>
            <div className="game-over-stats">
              <span>Quests: {state.questLog.length}</span>
              <span>NPCs Met: {state.npcsMetNames.length}</span>
              <span>Gold: {state.character.gold}</span>
            </div>
            <div className="game-over-actions">
              <button className="btn-primary btn-large" onClick={() => {
                dispatch({ type: 'NEW_GAME' });
                dispatch({ type: 'SET_PHASE', phase: 'setup' });
              }}>
                Start Anew
              </button>
              <button className="btn-secondary btn-large" onClick={() => setShowExport(true)}>
                Export Final Tale
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showSettings && <AISettings onClose={() => setShowSettings(false)} />}
      {showSaveLoad && <SaveLoad onClose={() => setShowSaveLoad(false)} />}
      {showExport && <QuestExport onClose={() => setShowExport(false)} />}
    </div>
  );
}

type CreateMode = 'presets' | 'random' | 'custom';

function ReturningHeroes() {
  const { dispatch } = useGame();
  const [roster, setRoster] = useState<RosterCharacter[]>(() => loadRoster());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (roster.length === 0) return null;

  const handleSelect = (rosterChar: RosterCharacter) => {
    // Set up the game state — the useEffect in GameContext will auto-trigger the AI intro
    dispatch({ type: 'LOAD_STATE', state: {
      phase: 'playing',
      character: { ...rosterChar.character, hp: rosterChar.character.maxHp },
      storyLog: [],
      combat: null,
      questLog: [],
      location: 'Unknown',
      npcsMetNames: [],
      sessionId: crypto.randomUUID(),
      rosterId: rosterChar.id,
      campaignStartDate: Date.now(),
    }});
  };

  const handleDelete = (id: string) => {
    deleteRosterCharacter(id);
    setRoster(loadRoster());
    setConfirmDeleteId(null);
  };

  return (
    <div className="returning-heroes">
      <h3 className="returning-title">Returning Heroes</h3>
      <p className="returning-subtitle">Continue with a seasoned adventurer. The DM remembers their past deeds.</p>
      <div className="roster-grid">
        {roster.map(rc => (
          <div key={rc.id} className="roster-card">
            <div className="roster-card-header" onClick={() => setExpandedId(expandedId === rc.id ? null : rc.id)}>
              <div className="roster-card-info">
                <span className="roster-name">{rc.character.name}</span>
                <span className="roster-details">
                  Level {rc.character.level} {rc.character.race} {rc.character.class}
                </span>
                <span className="roster-campaigns">
                  {rc.campaignHistory.length} campaign{rc.campaignHistory.length !== 1 ? 's' : ''} completed
                </span>
              </div>
              <span className="roster-expand">{expandedId === rc.id ? '\u25B2' : '\u25BC'}</span>
            </div>

            {expandedId === rc.id && (
              <div className="roster-card-expanded">
                <CharacterHistory campaigns={rc.campaignHistory} />
                <div className="roster-actions">
                  <button className="btn-primary" onClick={() => handleSelect(rc)}>
                    Continue with {rc.character.name}
                  </button>
                  {confirmDeleteId === rc.id ? (
                    <div className="roster-delete-confirm">
                      <span>Delete forever?</span>
                      <button className="btn-danger-sm" onClick={() => handleDelete(rc.id)}>Yes</button>
                      <button className="btn-secondary-sm" onClick={() => setConfirmDeleteId(null)}>No</button>
                    </div>
                  ) : (
                    <button className="btn-danger-sm" onClick={() => setConfirmDeleteId(rc.id)}>Delete</button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CharacterSelectScreen() {
  const [mode, setMode] = useState<CreateMode>('presets');

  return (
    <div className="character-select-screen">
      {/* Returning Heroes — shown first if roster has characters */}
      <ReturningHeroes />

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
