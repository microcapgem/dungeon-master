import type { Character } from '../../game/character';
import { getModifierString, xpForNextLevel } from '../../game/character';

interface CharacterSheetProps {
  character: Character;
  compact?: boolean;
  questLog?: string[];
  location?: string;
  npcsMetNames?: string[];
}

export function CharacterSheet({ character, compact = false, questLog, location, npcsMetNames }: CharacterSheetProps) {
  const hpPercent = (character.hp / character.maxHp) * 100;
  const hpColor = hpPercent > 60 ? '#2ecc71' : hpPercent > 30 ? '#e67e22' : '#e74c3c';
  const xpNext = xpForNextLevel(character.level);
  const xpPercent = character.level >= 20 ? 100 : (character.xp / xpNext) * 100;

  if (compact) {
    return (
      <div className="character-sheet-compact">
        <div className="cs-header">
          <strong>{character.name}</strong>
          <span className="cs-meta">{capitalize(character.race)} {capitalize(character.class)} Lv.{character.level}</span>
        </div>
        <div className="cs-hp-bar">
          <div className="hp-fill" style={{ width: `${hpPercent}%`, backgroundColor: hpColor }} />
          <span className="hp-text">{character.hp}/{character.maxHp} HP</span>
        </div>
        <div className="cs-quick-stats">
          <span>AC {character.ac}</span>
          <span>{character.gold} GP</span>
          <span>XP {character.xp}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="character-sheet">
      <div className="cs-header-full">
        <h2>{character.name}</h2>
        <p>{capitalize(character.race)} {capitalize(character.class)} &middot; Level {character.level}</p>
      </div>

      <div className="cs-hp-section">
        <div className="cs-hp-bar large">
          <div className="hp-fill" style={{ width: `${hpPercent}%`, backgroundColor: hpColor }} />
          <span className="hp-text">{character.hp}/{character.maxHp} HP</span>
        </div>
        <div className="cs-ac-badge">AC {character.ac}</div>
      </div>

      {/* XP Progress */}
      <div className="cs-xp-section">
        <div className="cs-xp-bar">
          <div className="xp-fill" style={{ width: `${Math.min(xpPercent, 100)}%` }} />
          <span className="xp-text">
            {character.level >= 20 ? 'MAX LEVEL' : `${character.xp} / ${xpNext} XP`}
          </span>
        </div>
      </div>

      <div className="cs-abilities">
        {Object.entries(character.abilities).map(([key, val]) => (
          <div key={key} className="ability-block">
            <div className="ability-name">{key}</div>
            <div className="ability-score">{val}</div>
            <div className="ability-mod">{getModifierString(val)}</div>
          </div>
        ))}
      </div>

      <div className="cs-inventory">
        <h4>Inventory</h4>
        <div className="inventory-list">
          {character.inventory.map((item, i) => (
            <span key={i} className="inventory-item">{item}</span>
          ))}
        </div>
        <div className="gold-display">{character.gold} Gold</div>
      </div>

      {location && (
        <div className="cs-location">
          <h4>Location</h4>
          <p>{location}</p>
        </div>
      )}

      {questLog && questLog.length > 0 && (
        <div className="cs-quests">
          <h4>Quest Log</h4>
          <ul className="quest-list">
            {questLog.map((q, i) => (
              <li key={i} className="quest-item">{q}</li>
            ))}
          </ul>
        </div>
      )}

      {npcsMetNames && npcsMetNames.length > 0 && (
        <div className="cs-npcs">
          <h4>NPCs Met</h4>
          <div className="npc-list">
            {npcsMetNames.map((name, i) => (
              <span key={i} className="npc-tag">{name}</span>
            ))}
          </div>
        </div>
      )}

      <div className="cs-backstory">
        <h4>Backstory</h4>
        <p>{character.backstory}</p>
      </div>
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
