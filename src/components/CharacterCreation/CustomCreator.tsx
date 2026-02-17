import { useState, useCallback } from 'react';
import { useGame } from '../../context/GameContext';
import {
  ALL_RACES, ALL_CLASSES, createCustomCharacter,
  calculateHP, calculateAC, getModifier, getModifierString,
} from '../../game/character';
import type { Race, CharClass, AbilityScores, Ability } from '../../game/character';

function rollStat(): number {
  const rolls = [1,2,3,4].map(() => Math.floor(Math.random() * 6) + 1);
  rolls.sort((a, b) => a - b);
  return rolls[1] + rolls[2] + rolls[3];
}

function rollAllStats(): AbilityScores {
  return { STR: rollStat(), DEX: rollStat(), CON: rollStat(), INT: rollStat(), WIS: rollStat(), CHA: rollStat() };
}

const ABILITY_TIPS: Record<Ability, string> = {
  STR: 'Physical power. Melee attacks, carrying, breaking things.',
  DEX: 'Agility & reflexes. Ranged attacks, stealth, dodging.',
  CON: 'Endurance. Determines HP and resisting poison/disease.',
  INT: 'Knowledge & memory. Wizard spellcasting, investigation.',
  WIS: 'Perception & insight. Cleric spellcasting, survival.',
  CHA: 'Force of personality. Persuasion, intimidation, deception.',
};

const CLASS_ICONS: Record<CharClass, string> = {
  fighter: '\u2694\uFE0F', wizard: '\u{1F9D9}', rogue: '\u{1F5E1}\uFE0F',
  cleric: '\u2728', barbarian: '\u{1FA93}', ranger: '\u{1F3F9}',
};

const CLASS_DESC: Record<CharClass, string> = {
  fighter: 'Versatile warrior, tough and reliable',
  wizard: 'Arcane spellcaster, powerful but fragile',
  rogue: 'Stealthy and cunning, deadly from shadows',
  cleric: 'Divine healer and protector',
  barbarian: 'Raging berserker, hard to kill',
  ranger: 'Wilderness tracker and archer',
};

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function CustomCreator() {
  const { dispatch, sendPlayerAction } = useGame();
  const [step, setStep] = useState(0); // 0=race, 1=class, 2=abilities, 3=details, 4=review
  const [race, setRace] = useState<Race>('human');
  const [charClass, setCharClass] = useState<CharClass>('fighter');
  const [abilities, setAbilities] = useState<AbilityScores>(rollAllStats);
  const [name, setName] = useState('');
  const [backstory, setBackstory] = useState('');

  const rerollStats = useCallback(() => {
    setAbilities(rollAllStats());
  }, []);

  const adjustAbility = (key: Ability, delta: number) => {
    setAbilities(prev => {
      const val = prev[key] + delta;
      if (val < 3 || val > 20) return prev;
      return { ...prev, [key]: val };
    });
  };

  const hp = calculateHP(charClass, abilities.CON, 1);
  const ac = calculateAC(charClass, abilities.DEX);

  const startAdventure = async () => {
    const finalName = name.trim() || 'Unnamed Adventurer';
    const finalBackstory = backstory.trim() || `A ${cap(race)} ${cap(charClass)} seeking adventure.`;
    const character = createCustomCharacter(finalName, race, charClass, abilities, finalBackstory);
    dispatch({ type: 'SET_CHARACTER', character });
    dispatch({ type: 'SET_PHASE', phase: 'playing' });
    await sendPlayerAction(
      `I am ${character.name}, a ${cap(character.race)} ${cap(character.class)}. ${character.backstory} I'm ready to begin my adventure!`
    );
  };

  return (
    <div className="custom-creator">
      {/* Progress bar */}
      <div className="cc-progress">
        {['Race', 'Class', 'Abilities', 'Details', 'Review'].map((label, i) => (
          <button
            key={label}
            className={`cc-step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}
            onClick={() => i <= step && setStep(i)}
          >
            <span className="cc-step-num">{i + 1}</span>
            <span className="cc-step-label">{label}</span>
          </button>
        ))}
      </div>

      {/* Step 0: Race */}
      {step === 0 && (
        <div className="cc-section">
          <h3 className="cc-heading">Choose Your Race</h3>
          <p className="cc-hint">Your race determines your heritage and some innate traits.</p>
          <div className="cc-option-grid">
            {ALL_RACES.map(r => (
              <button
                key={r}
                className={`cc-option-card ${race === r ? 'selected' : ''}`}
                onClick={() => setRace(r)}
              >
                <span className="cc-option-name">{cap(r)}</span>
              </button>
            ))}
          </div>
          <button className="btn-primary cc-next" onClick={() => setStep(1)}>Next: Choose Class</button>
        </div>
      )}

      {/* Step 1: Class */}
      {step === 1 && (
        <div className="cc-section">
          <h3 className="cc-heading">Choose Your Class</h3>
          <p className="cc-hint">Your class defines your abilities, playstyle, and role in the party.</p>
          <div className="cc-option-grid">
            {ALL_CLASSES.map(c => (
              <button
                key={c}
                className={`cc-option-card cc-class-card ${charClass === c ? 'selected' : ''}`}
                onClick={() => setCharClass(c)}
              >
                <span className="cc-class-icon">{CLASS_ICONS[c]}</span>
                <span className="cc-option-name">{cap(c)}</span>
                <span className="cc-class-desc">{CLASS_DESC[c]}</span>
              </button>
            ))}
          </div>
          <div className="cc-nav-row">
            <button className="btn-secondary" onClick={() => setStep(0)}>Back</button>
            <button className="btn-primary" onClick={() => setStep(2)}>Next: Abilities</button>
          </div>
        </div>
      )}

      {/* Step 2: Ability scores */}
      {step === 2 && (
        <div className="cc-section">
          <h3 className="cc-heading">Ability Scores</h3>
          <p className="cc-hint">These are rolled using 4d6 drop lowest. Adjust or re-roll as you like.</p>
          <div className="cc-abilities">
            {(Object.keys(abilities) as Ability[]).map(key => (
              <div key={key} className="cc-ability-row">
                <div className="cc-ability-info">
                  <span className="cc-ability-name">{key}</span>
                  <span className="cc-ability-tip">{ABILITY_TIPS[key]}</span>
                </div>
                <div className="cc-ability-controls">
                  <button className="cc-adj-btn" onClick={() => adjustAbility(key, -1)}>-</button>
                  <span className="cc-ability-val">{abilities[key]}</span>
                  <button className="cc-adj-btn" onClick={() => adjustAbility(key, 1)}>+</button>
                  <span className="cc-ability-mod">({getModifierString(abilities[key])})</span>
                </div>
              </div>
            ))}
          </div>
          <button className="btn-secondary cc-reroll" onClick={rerollStats}>Re-roll All</button>
          <div className="cc-derived">
            <span>HP: <strong>{hp}</strong></span>
            <span>AC: <strong>{ac}</strong></span>
          </div>
          <div className="cc-nav-row">
            <button className="btn-secondary" onClick={() => setStep(1)}>Back</button>
            <button className="btn-primary" onClick={() => setStep(3)}>Next: Details</button>
          </div>
        </div>
      )}

      {/* Step 3: Name & Backstory */}
      {step === 3 && (
        <div className="cc-section">
          <h3 className="cc-heading">Name & Backstory</h3>
          <p className="cc-hint">Give your character a name and history. Leave blank for defaults.</p>
          <div className="cc-field">
            <label className="cc-field-label">Character Name</label>
            <input
              className="settings-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={`e.g. ${cap(race)} ${cap(charClass)}`}
            />
          </div>
          <div className="cc-field">
            <label className="cc-field-label">Backstory</label>
            <textarea
              className="settings-input cc-textarea"
              value={backstory}
              onChange={e => setBackstory(e.target.value)}
              placeholder="A brief history of your character... (optional)"
              rows={4}
            />
          </div>
          <div className="cc-nav-row">
            <button className="btn-secondary" onClick={() => setStep(2)}>Back</button>
            <button className="btn-primary" onClick={() => setStep(4)}>Review Character</button>
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <div className="cc-section">
          <h3 className="cc-heading">Your Character</h3>
          <div className="cc-review-card">
            <div className="cc-review-header">
              <span className="cc-review-icon">{CLASS_ICONS[charClass]}</span>
              <div>
                <div className="cc-review-name">{name || 'Unnamed Adventurer'}</div>
                <div className="cc-review-meta">{cap(race)} {cap(charClass)} — Level 1</div>
              </div>
            </div>
            <div className="cc-review-stats">
              <span>HP <strong>{hp}</strong></span>
              <span>AC <strong>{ac}</strong></span>
              <span>Gold <strong>15</strong></span>
            </div>
            <div className="cc-review-abilities">
              {(Object.entries(abilities) as [Ability, number][]).map(([k, v]) => (
                <span key={k} className="stat-badge">{k} {v} <small>({getModifierString(v)})</small></span>
              ))}
            </div>
            {(backstory || name) && (
              <p className="cc-review-backstory">{backstory || `A ${cap(race)} ${cap(charClass)} seeking adventure.`}</p>
            )}
          </div>
          <div className="cc-nav-row">
            <button className="btn-secondary" onClick={() => setStep(3)}>Back</button>
            <button className="btn-primary btn-large" onClick={startAdventure}>Begin Adventure!</button>
          </div>
        </div>
      )}
    </div>
  );
}
