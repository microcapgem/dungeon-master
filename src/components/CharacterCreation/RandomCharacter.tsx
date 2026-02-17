import { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { generateRandomCharacter, getModifierString } from '../../game/character';
import type { Character } from '../../game/character';

const CLASS_ICONS: Record<string, string> = {
  fighter: '\u2694\uFE0F', wizard: '\u{1F9D9}', rogue: '\u{1F5E1}\uFE0F',
  cleric: '\u2728', barbarian: '\u{1FA93}', ranger: '\u{1F3F9}',
};

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function RandomCharacter() {
  const { dispatch, sendPlayerAction } = useGame();
  const [character, setCharacter] = useState<Character>(generateRandomCharacter);

  const reroll = () => setCharacter(generateRandomCharacter());

  const startAdventure = async () => {
    dispatch({ type: 'SET_CHARACTER', character });
    dispatch({ type: 'SET_PHASE', phase: 'playing' });
    await sendPlayerAction(
      `I am ${character.name}, a ${cap(character.race)} ${cap(character.class)}. ${character.backstory} I'm ready to begin my adventure!`
    );
  };

  return (
    <div className="random-character">
      <div className="rc-card">
        <div className="rc-header">
          <span className="rc-icon">{CLASS_ICONS[character.class] || '\u2694\uFE0F'}</span>
          <div>
            <div className="rc-name">{character.name}</div>
            <div className="rc-meta">{cap(character.race)} {cap(character.class)} — Level 1</div>
          </div>
        </div>

        <div className="rc-stats-row">
          <span className="rc-stat">HP <strong>{character.hp}</strong></span>
          <span className="rc-stat">AC <strong>{character.ac}</strong></span>
          <span className="rc-stat">Gold <strong>{character.gold}</strong></span>
        </div>

        <div className="rc-abilities">
          {(Object.entries(character.abilities) as [string, number][]).map(([key, val]) => (
            <span key={key} className="stat-badge">
              {key} {val} <small>({getModifierString(val)})</small>
            </span>
          ))}
        </div>

        <p className="rc-backstory">{character.backstory}</p>

        <div className="rc-inventory">
          <span className="rc-inv-label">Equipment:</span>
          {character.inventory.map((item, i) => (
            <span key={i} className="rc-inv-item">{item}</span>
          ))}
        </div>
      </div>

      <div className="rc-actions">
        <button className="btn-secondary btn-large" onClick={reroll}>
          Re-roll Character
        </button>
        <button className="btn-primary btn-large" onClick={startAdventure}>
          Play as {character.name.split(' ')[0]}!
        </button>
      </div>
    </div>
  );
}
