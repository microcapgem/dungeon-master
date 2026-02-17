export type DieType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';

export interface DiceRoll {
  die: DieType;
  count: number;
  modifier: number;
  reason: string;
}

export interface DiceResult {
  roll: DiceRoll;
  values: number[];
  total: number;
}

export const DIE_MAX: Record<DieType, number> = {
  d4: 4, d6: 6, d8: 8, d10: 10, d12: 12, d20: 20,
};

export function rollDie(die: DieType): number {
  return Math.floor(Math.random() * DIE_MAX[die]) + 1;
}

export function rollDice(roll: DiceRoll): DiceResult {
  const values: number[] = [];
  for (let i = 0; i < roll.count; i++) {
    values.push(rollDie(roll.die));
  }
  const total = values.reduce((sum, v) => sum + v, 0) + roll.modifier;
  return { roll, values, total };
}

export function parseDiceString(str: string): DiceRoll | null {
  // Parses: "2d6+3", "d20", "1d8-1", etc.
  const match = str.match(/^(\d*)d(\d+)([+-]\d+)?$/i);
  if (!match) return null;

  const count = match[1] ? parseInt(match[1]) : 1;
  const sides = parseInt(match[2]);
  const modifier = match[3] ? parseInt(match[3]) : 0;

  const dieType = `d${sides}` as DieType;
  if (!(dieType in DIE_MAX)) return null;

  return { die: dieType, count, modifier, reason: '' };
}

export function formatRoll(result: DiceResult): string {
  const { roll, values, total } = result;
  const diceStr = `${roll.count}${roll.die}`;
  const modStr = roll.modifier > 0 ? `+${roll.modifier}` : roll.modifier < 0 ? `${roll.modifier}` : '';
  const valStr = values.length > 1 ? `[${values.join(', ')}]` : `${values[0]}`;
  return `${diceStr}${modStr}: ${valStr}${modStr ? ` ${roll.modifier > 0 ? '+' : ''}${roll.modifier}` : ''} = ${total}`;
}
