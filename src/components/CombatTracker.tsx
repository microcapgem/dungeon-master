import type { CombatState } from '../game/state';
import type { Character } from '../game/character';

interface CombatTrackerProps {
  combat: CombatState;
  character: Character;
}

export function CombatTracker({ combat, character }: CombatTrackerProps) {
  return (
    <div className="combat-tracker">
      <div className="combat-header">
        <span className="combat-round">Round {combat.round}</span>
        <span className={`combat-turn ${combat.playerTurn ? 'player-turn' : 'enemy-turn'}`}>
          {combat.playerTurn ? 'Your Turn' : "Enemy's Turn"}
        </span>
      </div>

      <div className="combat-participants">
        {/* Player */}
        <div className="combatant player">
          <div className="combatant-name">{character.name}</div>
          <div className="combatant-hp-bar">
            <div
              className="hp-fill"
              style={{
                width: `${(character.hp / character.maxHp) * 100}%`,
                backgroundColor: character.hp > character.maxHp * 0.5 ? '#2ecc71' : character.hp > character.maxHp * 0.25 ? '#e67e22' : '#e74c3c',
              }}
            />
            <span className="hp-text">{character.hp}/{character.maxHp}</span>
          </div>
          {character.hp === 0 && (
            <div className="death-saves">
              <span>Death Saves: </span>
              <span className="save-success">{'O'.repeat(combat.deathSaves.successes)}{'_'.repeat(3 - combat.deathSaves.successes)}</span>
              {' / '}
              <span className="save-failure">{'X'.repeat(combat.deathSaves.failures)}{'_'.repeat(3 - combat.deathSaves.failures)}</span>
            </div>
          )}
        </div>

        <div className="vs-divider">VS</div>

        {/* Enemies */}
        {combat.enemies.map((enemy, i) => (
          <div key={i} className={`combatant enemy ${enemy.hp === 0 ? 'defeated' : ''}`}>
            <div className="combatant-name">{enemy.name} {enemy.hp === 0 ? '(Defeated)' : ''}</div>
            <div className="combatant-hp-bar">
              <div
                className="hp-fill enemy-hp"
                style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
              />
              <span className="hp-text">{enemy.hp}/{enemy.maxHp}</span>
            </div>
            <span className="enemy-ac">AC {enemy.ac}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
