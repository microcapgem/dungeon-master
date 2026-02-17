import { useState, useCallback, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { createSave } from '../utils/storage';
import { StoryLog } from './Narrative/StoryLog';
import { ActionInput } from './Narrative/ActionInput';
import { CharacterSheet } from './CharacterCreation/CharacterSheet';
import { CombatTracker } from './CombatTracker';
import { DiceScene } from './DiceRoller/DiceScene';
import type { DieType } from '../game/dice';
import type { DiceResult } from '../game/dice';
import { DIE_MAX } from '../game/dice';
import { xpForNextLevel } from '../game/character';

/** Normalize AI dice strings like "1d8", "1d20", "D6" → "d8", "d20", "d6" */
function normalizeDieType(raw: string | undefined): DieType {
  if (!raw) return 'd20';
  const cleaned = raw.toLowerCase().replace(/^\d+/, ''); // strip leading count
  if (cleaned in DIE_MAX) return cleaned as DieType;
  return 'd20';
}

export function GameScreen() {
  const {
    state, sendPlayerAction, sendRollResult,
    isAIResponding, streamingText,
    pendingRoll, suggestedActions,
    undoLastTurn, canUndo, lastAutoSave,
  } = useGame();
  const [showSheet, setShowSheet] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [hpExpanded, setHpExpanded] = useState(false);
  const [quickSaveFlash, setQuickSaveFlash] = useState('');

  // Ctrl+S quick save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (state.character) {
          const name = `Quick Save - ${state.character.name}`;
          createSave(name, state);
          setQuickSaveFlash('Saved!');
          setTimeout(() => setQuickSaveFlash(''), 1500);
        }
      }
      // Ctrl+Z undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo && !isAIResponding) {
          undoLastTurn();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state, canUndo, isAIResponding, undoLastTurn]);

  const handleAction = useCallback(async (action: string) => {
    await sendPlayerAction(action);
  }, [sendPlayerAction]);

  const handleRollResult = useCallback(async (value: number) => {
    if (!pendingRoll) return;
    setRolling(false);
    const dieType = normalizeDieType(pendingRoll.dice);
    const result: DiceResult = {
      roll: {
        die: dieType,
        count: 1,
        modifier: pendingRoll.modifier || 0,
        reason: pendingRoll.reason || 'Roll',
      },
      values: [value],
      total: value + (pendingRoll.modifier || 0),
    };
    await sendRollResult(result, pendingRoll.dc);
  }, [pendingRoll, sendRollResult]);

  const char = state.character;
  const hpPercent = char ? (char.hp / char.maxHp) * 100 : 100;
  const hpColor = hpPercent > 60 ? '#2ecc71' : hpPercent > 30 ? '#e67e22' : '#e74c3c';

  return (
    <div className="game-screen">
      {/* Fixed HP strip at top — always visible, click to expand */}
      {char && (
        <div className="hp-strip" onClick={() => setHpExpanded(!hpExpanded)}>
          <div className="hp-strip-bar">
            <div className="hp-strip-fill" style={{ width: `${hpPercent}%`, backgroundColor: hpColor }} />
            <span className="hp-strip-text">
              {char.name} &mdash; {char.hp}/{char.maxHp} HP &nbsp; AC {char.ac}
              {state.combat && <span className="hp-strip-combat"> &mdash; COMBAT Round {state.combat.round}</span>}
              <span className="hp-strip-hint">{hpExpanded ? '\u25B2' : '\u25BC'}</span>
            </span>
          </div>

          {/* Expandable section */}
          {hpExpanded && (
            <div className="hp-strip-expanded">
              {state.combat && (
                <CombatTracker combat={state.combat} character={char} />
              )}
              {!state.combat && (
                <div className="hp-strip-quick-stats">
                  <span>Level {char.level}</span>
                  <span>{char.xp}/{char.level >= 20 ? 'MAX' : xpForNextLevel(char.level)} XP</span>
                  <span>{char.gold} Gold</span>
                  <span>{char.inventory.length} Items</span>
                  <span>{state.questLog.length} Quests</span>
                </div>
              )}
              {state.combat && char.hp === 0 && (
                <div className="death-saves-strip">
                  <span className="death-save-label">DEATH SAVES:</span>
                  <span className="death-save-success">
                    {Array.from({ length: 3 }, (_, i) => (
                      <span key={i} className={i < state.combat!.deathSaves.successes ? 'save-filled success' : 'save-empty'}>{'\u25CF'}</span>
                    ))}
                  </span>
                  <span className="death-save-failure">
                    {Array.from({ length: 3 }, (_, i) => (
                      <span key={i} className={i < state.combat!.deathSaves.failures ? 'save-filled failure' : 'save-empty'}>{'\u25CF'}</span>
                    ))}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quick save flash */}
      {quickSaveFlash && <div className="quick-save-flash">{quickSaveFlash}</div>}

      {/* Auto-save indicator */}
      {lastAutoSave && (
        <div className="auto-save-indicator" title={`Last saved: ${new Date(lastAutoSave).toLocaleTimeString()}`}>
          Auto-saved
        </div>
      )}

      {/* Undo button */}
      {canUndo && !isAIResponding && (
        <button
          className="undo-fab"
          onClick={undoLastTurn}
          title="Undo last action (Ctrl+Z)"
        >
          {'\u21A9'}
        </button>
      )}

      {/* Fixed Character button — opens full sheet overlay */}
      <button className="character-fab" onClick={() => setShowSheet(!showSheet)}>
        {showSheet ? '\u2715' : '\u{1F4DC}'}
      </button>

      {/* Character sheet overlay */}
      {showSheet && char && (
        <div className="character-overlay" onClick={() => setShowSheet(false)}>
          <div className="character-overlay-panel" onClick={(e) => e.stopPropagation()}>
            <button className="overlay-close" onClick={() => setShowSheet(false)}>{'\u2715'}</button>
            <CharacterSheet
              character={char}
              questLog={state.questLog}
              location={state.location}
              npcsMetNames={state.npcsMetNames}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="game-main">
        {/* Story log */}
        <StoryLog
          entries={state.storyLog}
          streamingText={streamingText}
          isStreaming={isAIResponding}
        />

        {/* Dice roller */}
        {pendingRoll && (
          <div className="dice-section">
            <div className="roll-prompt">
              <span className="roll-reason">{pendingRoll.reason}</span>
              {pendingRoll.dc != null && <span className="roll-dc">DC {pendingRoll.dc}</span>}
              {pendingRoll.modifier !== 0 && (
                <span className="roll-modifier">
                  Modifier: {pendingRoll.modifier > 0 ? '+' : ''}{pendingRoll.modifier}
                </span>
              )}
            </div>
            <DiceScene
              dieType={normalizeDieType(pendingRoll.dice)}
              onResult={handleRollResult}
              rolling={rolling}
              onRollStart={() => setRolling(true)}
            />
          </div>
        )}

        {/* Action input */}
        {!pendingRoll && (
          <ActionInput
            onSubmit={handleAction}
            disabled={isAIResponding}
            suggestedActions={suggestedActions}
          />
        )}
      </main>
    </div>
  );
}
