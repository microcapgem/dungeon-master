import type { Character } from '../../game/character';
import { getModifierString } from '../../game/character';

interface CharacterSheetProps {
  character: Character;
  compact?: boolean;
}

export function CharacterSheet({ character, compact = false }: CharacterSheetProps) {
  const hpPercent = (character.hp / character.maxHp) * 100;
  const hpColor = hpPercent > 60 ? '#2ecc71' : hpPercent > 30 ? '#e67e22' : '#e74c3c';

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
