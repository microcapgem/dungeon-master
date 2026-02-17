import type { CharacterPreset } from '../../game/character';
import { CHARACTER_PRESETS, createCharacterFromPreset, getModifierString } from '../../game/character';
import { useGame } from '../../context/GameContext';

export function QuickPresets() {
  const { dispatch, sendPlayerAction } = useGame();

  const selectPreset = async (preset: CharacterPreset) => {
    const character = createCharacterFromPreset(preset);
    dispatch({ type: 'SET_CHARACTER', character });
    dispatch({ type: 'SET_PHASE', phase: 'playing' });
    // Kick off the adventure
    await sendPlayerAction(
      `I am ${character.name}, a ${character.race} ${character.class}. ${character.backstory} I'm ready to begin my adventure!`
    );
  };

  return (
    <div className="presets-grid">
      {CHARACTER_PRESETS.map((preset) => (
        <div key={preset.name} className="preset-card" onClick={() => selectPreset(preset)}>
          <div className="preset-class-icon">{getClassIcon(preset.class)}</div>
          <h3 className="preset-name">{preset.name}</h3>
          <div className="preset-meta">{capitalize(preset.race)} {capitalize(preset.class)}</div>
          <p className="preset-flavor">{preset.flavor}</p>
          <div className="preset-stats">
            {Object.entries(preset.abilities).map(([key, val]) => (
              <span key={key} className="stat-badge">
                {key} {val} <small>({getModifierString(val)})</small>
              </span>
            ))}
          </div>
          <p className="preset-backstory">{preset.backstory}</p>
        </div>
      ))}
    </div>
  );
}

function getClassIcon(cls: string): string {
  const icons: Record<string, string> = {
    fighter: '\u2694\uFE0F',
    wizard: '\u{1F9D9}',
    rogue: '\u{1F5E1}\uFE0F',
    cleric: '\u2728',
    barbarian: '\u{1FA93}',
    ranger: '\u{1F3F9}',
  };
  return icons[cls] || '\u2694\uFE0F';
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
