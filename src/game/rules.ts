import type { Character, CharClass, Ability } from './character';
import { getModifier } from './character';
import type { DiceRoll } from './dice';

// Maps class to their primary attack ability
const CLASS_ATTACK_ABILITY: Record<CharClass, Ability> = {
  fighter: 'STR', barbarian: 'STR', cleric: 'STR',
  ranger: 'DEX', rogue: 'DEX', wizard: 'INT',
};

// Maps class to damage die
const CLASS_DAMAGE_DIE: Record<CharClass, string> = {
  fighter: '1d10', barbarian: '1d12', cleric: '1d8',
  ranger: '1d8', rogue: '1d6', wizard: '1d6',
};

export function getAttackRoll(char: Character): DiceRoll {
  const ability = CLASS_ATTACK_ABILITY[char.class];
  const proficiency = Math.floor((char.level - 1) / 4) + 2;
  const modifier = getModifier(char.abilities[ability]) + proficiency;
  return { die: 'd20', count: 1, modifier, reason: 'Attack roll' };
}

export function getDamageRoll(char: Character): DiceRoll {
  const ability = CLASS_ATTACK_ABILITY[char.class];
  const modifier = getModifier(char.abilities[ability]);
  const dmgDie = CLASS_DAMAGE_DIE[char.class];
  const match = dmgDie.match(/(\d+)d(\d+)/);
  return {
    die: `d${match![2]}` as DiceRoll['die'],
    count: parseInt(match![1]),
    modifier,
    reason: 'Damage roll',
  };
}

export function getAbilityCheckRoll(char: Character, ability: Ability, proficient = false): DiceRoll {
  const proficiency = proficient ? Math.floor((char.level - 1) / 4) + 2 : 0;
  const modifier = getModifier(char.abilities[ability]) + proficiency;
  return { die: 'd20', count: 1, modifier, reason: `${ability} check` };
}

export function getSavingThrowRoll(char: Character, ability: Ability): DiceRoll {
  const modifier = getModifier(char.abilities[ability]);
  return { die: 'd20', count: 1, modifier, reason: `${ability} saving throw` };
}

export function getInitiativeRoll(char: Character): DiceRoll {
  const modifier = getModifier(char.abilities.DEX);
  return { die: 'd20', count: 1, modifier, reason: 'Initiative' };
}

export function getDeathSavingThrow(): DiceRoll {
  return { die: 'd20', count: 1, modifier: 0, reason: 'Death saving throw' };
}

export function xpForLevel(level: number): number {
  const thresholds = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000];
  return thresholds[Math.min(level, thresholds.length - 1)];
}

export function canLevelUp(char: Character): boolean {
  return char.xp >= xpForLevel(char.level);
}
