import { useState, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { StoryLog } from './Narrative/StoryLog';
import { ActionInput } from './Narrative/ActionInput';
import { CharacterSheet } from './CharacterCreation/CharacterSheet';
import { CombatTracker } from './CombatTracker';
import { DiceScene } from './DiceRoller/DiceScene';
import type { DieType } from '../game/dice';
import type { DiceResult } from '../game/dice';

export function GameScreen() {
  const {
    state, sendPlayerAction, sendRollResult,
    isAIResponding, streamingText,
    pendingRoll, suggestedActions,
  } = useGame();
  const [showSheet, setShowSheet] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [hpExpanded, setHpExpanded] = useState(false);

  const handleAction = useCallback(async (action: string) => {
    await sendPlayerAction(action);
  }, [sendPlayerAction]);

  const handleRollResult = useCallback(async (value: number) => {
    if (!pendingRoll) return;
    setRolling(false);
    const result: DiceResult = {
      roll: {
        die: (pendingRoll.dice || 'd20') as DieType,
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
                  <span>{char.xp} XP</span>
                  <span>{char.gold} Gold</span>
                  <span>{char.inventory.length} Items</span>
                </div>
              )}
            </div>
          )}
        </div>
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
            <CharacterSheet character={char} />
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
              dieType={(pendingRoll.dice || 'd20') as DieType}
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
