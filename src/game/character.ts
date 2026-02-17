export type Race = 'human' | 'elf' | 'dwarf' | 'halfling' | 'half-orc' | 'tiefling';
export type CharClass = 'fighter' | 'wizard' | 'rogue' | 'cleric' | 'ranger' | 'barbarian';

export interface AbilityScores {
  STR: number;
  DEX: number;
  CON: number;
  INT: number;
  WIS: number;
  CHA: number;
}

export type Ability = keyof AbilityScores;

export interface Character {
  name: string;
  race: Race;
  class: CharClass;
  level: number;
  xp: number;
  hp: number;
  maxHp: number;
  ac: number;
  abilities: AbilityScores;
  backstory: string;
  inventory: string[];
  gold: number;
}

// 5e XP thresholds per level (level → XP needed to reach that level)
export const XP_THRESHOLDS: Record<number, number> = {
  1: 0, 2: 300, 3: 900, 4: 2700, 5: 6500,
  6: 14000, 7: 23000, 8: 34000, 9: 48000, 10: 64000,
  11: 85000, 12: 100000, 13: 120000, 14: 140000, 15: 165000,
  16: 195000, 17: 225000, 18: 265000, 19: 305000, 20: 355000,
};

export function xpForNextLevel(currentLevel: number): number {
  if (currentLevel >= 20) return Infinity;
  return XP_THRESHOLDS[currentLevel + 1];
}

export function shouldLevelUp(xp: number, currentLevel: number): boolean {
  if (currentLevel >= 20) return false;
  return xp >= XP_THRESHOLDS[currentLevel + 1];
}

export function getModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function getModifierString(score: number): string {
  const mod = getModifier(score);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export function calculateHP(charClass: CharClass, con: number, level: number): number {
  const hitDice: Record<CharClass, number> = {
    barbarian: 12, fighter: 10, ranger: 10,
    cleric: 8, rogue: 8, wizard: 6,
  };
  const base = hitDice[charClass] + getModifier(con);
  const perLevel = Math.floor(hitDice[charClass] / 2) + 1 + getModifier(con);
  return base + perLevel * (level - 1);
}

export function calculateAC(charClass: CharClass, dex: number): number {
  const mod = getModifier(dex);
  switch (charClass) {
    case 'barbarian': return 10 + mod + 2; // unarmored + CON approx
    case 'fighter': return 16 + Math.min(mod, 2); // chain mail
    case 'cleric': return 16 + Math.min(mod, 2); // scale mail + shield
    case 'ranger': return 14 + Math.min(mod, 2); // leather + decent
    case 'rogue': return 12 + mod; // leather
    case 'wizard': return 10 + mod; // no armor
  }
}

export interface CharacterPreset {
  name: string;
  race: Race;
  class: CharClass;
  abilities: AbilityScores;
  backstory: string;
  flavor: string;
  inventory: string[];
}

export const CHARACTER_PRESETS: CharacterPreset[] = [
  {
    name: 'Aldric Stoneshield',
    race: 'human',
    class: 'fighter',
    abilities: { STR: 16, DEX: 12, CON: 14, INT: 10, WIS: 11, CHA: 13 },
    backstory: 'A former city guard who left duty after witnessing corruption in the ranks. Now seeks to protect the innocent on his own terms.',
    flavor: 'Sturdy and reliable. Hits hard, takes hits harder. Great for beginners.',
    inventory: ['Longsword', 'Shield', 'Chain mail', 'Explorer\'s pack'],
  },
  {
    name: 'Lyra Moonwhisper',
    race: 'elf',
    class: 'wizard',
    abilities: { STR: 8, DEX: 14, CON: 12, INT: 16, WIS: 13, CHA: 10 },
    backstory: 'An elven scholar who discovered a forbidden tome in the ruins of an ancient library. The secrets within drove her to seek more knowledge at any cost.',
    flavor: 'Fragile but devastating. Bends reality with arcane magic.',
    inventory: ['Quarterstaff', 'Spellbook', 'Component pouch', 'Scholar\'s pack'],
  },
  {
    name: 'Finn Lightfoot',
    race: 'halfling',
    class: 'rogue',
    abilities: { STR: 10, DEX: 16, CON: 12, INT: 13, WIS: 11, CHA: 14 },
    backstory: 'A charming street urchin from the capital\'s underbelly. What he lacks in size, he makes up for in cunning and impossibly quick fingers.',
    flavor: 'Sneaky and clever. Picks locks, disarms traps, stabs from the shadows.',
    inventory: ['Shortsword', 'Shortbow', 'Leather armor', 'Thieves\' tools', 'Burglar\'s pack'],
  },
  {
    name: 'Bronwyn Ironheart',
    race: 'dwarf',
    class: 'cleric',
    abilities: { STR: 14, DEX: 10, CON: 15, INT: 11, WIS: 16, CHA: 12 },
    backstory: 'A devoted healer of Moradin who lost her temple to a dragon attack. She wanders the land mending wounds and seeking divine justice.',
    flavor: 'Heals, protects, and smites. The backbone of any adventure.',
    inventory: ['Warhammer', 'Shield', 'Scale mail', 'Holy symbol', 'Priest\'s pack'],
  },
  {
    name: 'Kael Stormrunner',
    race: 'half-orc',
    class: 'barbarian',
    abilities: { STR: 17, DEX: 13, CON: 15, INT: 8, WIS: 10, CHA: 11 },
    backstory: 'Raised by wolves after being abandoned as an infant. His rage is primal, his loyalty unshakable, and his appetite legendary.',
    flavor: 'Pure fury. Rages into battle and shrugs off damage. Simple and devastating.',
    inventory: ['Greataxe', 'Handaxe (2)', 'Explorer\'s pack', 'Javelins (4)'],
  },
  {
    name: 'Sera Duskwalker',
    race: 'tiefling',
    class: 'ranger',
    abilities: { STR: 12, DEX: 16, CON: 13, INT: 11, WIS: 14, CHA: 10 },
    backstory: 'Shunned by superstitious villagers for her infernal heritage, she found solace in the wilderness. The forests accept all who respect them.',
    flavor: 'Versatile tracker and archer. At home in the wild, deadly at range.',
    inventory: ['Longbow', 'Shortsword (2)', 'Leather armor', 'Explorer\'s pack'],
  },
];

// ============ Random names ============

const FIRST_NAMES: Record<Race, string[]> = {
  human:    ['Aldric', 'Gareth', 'Elena', 'Mira', 'Theron', 'Cassandra', 'Roland', 'Freya'],
  elf:      ['Lyra', 'Thalion', 'Arwen', 'Faelar', 'Celeste', 'Elyndor', 'Seraphina', 'Arannis'],
  dwarf:    ['Bronwyn', 'Torgin', 'Hilda', 'Durak', 'Gretta', 'Balin', 'Dagny', 'Thrain'],
  halfling: ['Finn', 'Rosie', 'Pippin', 'Marigold', 'Bramble', 'Tansy', 'Cob', 'Wren'],
  'half-orc': ['Kael', 'Shara', 'Grom', 'Zara', 'Thokk', 'Vala', 'Drog', 'Neera'],
  tiefling: ['Sera', 'Mordai', 'Lilith', 'Zephyr', 'Ravyn', 'Damien', 'Nyx', 'Ashara'],
};

const LAST_NAMES: Record<Race, string[]> = {
  human:    ['Stoneshield', 'Brightblade', 'Ashford', 'Ravencrest', 'Ironwill', 'Dawnstrider'],
  elf:      ['Moonwhisper', 'Starweaver', 'Windwalker', 'Dawnpetal', 'Silverleaf', 'Nightbloom'],
  dwarf:    ['Ironheart', 'Deepdelve', 'Forgehammer', 'Stonehelm', 'Goldvein', 'Battleborn'],
  halfling: ['Lightfoot', 'Goodbarrel', 'Underbough', 'Tealeaf', 'Thorngage', 'Burrows'],
  'half-orc': ['Stormrunner', 'Skullcrusher', 'Bloodfang', 'Thunderfist', 'Bonecleaver', 'Ironjaw'],
  tiefling: ['Duskwalker', 'Hellbane', 'Shadowmere', 'Ashborn', 'Grimsoul', 'Nightfire'],
};

const BACKSTORIES: Record<CharClass, string[]> = {
  fighter:   [
    'A former soldier who left the army after a war that cost too many lives.',
    'Trained by a legendary swordmaster who vanished mysteriously.',
    'A tournament champion seeking glory beyond the arena walls.',
  ],
  wizard:    [
    'A scholar who discovered forbidden magic in ancient ruins.',
    'Apprentice to a powerful mage who was consumed by their own spell.',
    'Self-taught from a spellbook found in a dragon\'s abandoned hoard.',
  ],
  rogue:     [
    'A charming street urchin who learned to survive by wit and quick fingers.',
    'A former spy who knows too many dangerous secrets.',
    'A treasure hunter drawn to ancient tombs and deadly traps.',
  ],
  cleric:    [
    'A devoted healer whose temple was destroyed, now seeking justice.',
    'Called by divine visions to embark on a sacred quest.',
    'A former soldier who found faith on the battlefield.',
  ],
  ranger:    [
    'Raised in the wilderness after being abandoned as a child.',
    'A bounty hunter who tracks monsters through the untamed frontier.',
    'Sworn to protect the ancient forests from encroaching darkness.',
  ],
  barbarian: [
    'Raised by wolves, driven by primal instinct and unshakable loyalty.',
    'Last survivor of a tribe destroyed by a great evil.',
    'An arena gladiator who broke free and now seeks true freedom.',
  ],
};

const CLASS_INVENTORIES: Record<CharClass, string[]> = {
  fighter:   ['Longsword', 'Shield', 'Chain mail', 'Explorer\'s pack'],
  wizard:    ['Quarterstaff', 'Spellbook', 'Component pouch', 'Scholar\'s pack'],
  rogue:     ['Shortsword', 'Shortbow', 'Leather armor', 'Thieves\' tools', 'Burglar\'s pack'],
  cleric:    ['Warhammer', 'Shield', 'Scale mail', 'Holy symbol', 'Priest\'s pack'],
  ranger:    ['Longbow', 'Shortsword (2)', 'Leather armor', 'Explorer\'s pack'],
  barbarian: ['Greataxe', 'Handaxe (2)', 'Explorer\'s pack', 'Javelins (4)'],
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Roll 4d6, drop lowest
function rollAbilityScore(): number {
  const rolls = [1,2,3,4].map(() => Math.floor(Math.random() * 6) + 1);
  rolls.sort((a, b) => a - b);
  return rolls[1] + rolls[2] + rolls[3]; // drop lowest
}

export const ALL_RACES: Race[] = ['human', 'elf', 'dwarf', 'halfling', 'half-orc', 'tiefling'];
export const ALL_CLASSES: CharClass[] = ['fighter', 'wizard', 'rogue', 'cleric', 'ranger', 'barbarian'];

export function generateRandomCharacter(): Character {
  const race = pick(ALL_RACES);
  const charClass = pick(ALL_CLASSES);
  const name = `${pick(FIRST_NAMES[race])} ${pick(LAST_NAMES[race])}`;
  const abilities: AbilityScores = {
    STR: rollAbilityScore(),
    DEX: rollAbilityScore(),
    CON: rollAbilityScore(),
    INT: rollAbilityScore(),
    WIS: rollAbilityScore(),
    CHA: rollAbilityScore(),
  };
  const backstory = pick(BACKSTORIES[charClass]);
  const hp = calculateHP(charClass, abilities.CON, 1);

  return {
    name,
    race,
    class: charClass,
    level: 1,
    xp: 0,
    hp,
    maxHp: hp,
    ac: calculateAC(charClass, abilities.DEX),
    abilities,
    backstory,
    inventory: [...CLASS_INVENTORIES[charClass]],
    gold: 10 + Math.floor(Math.random() * 20),
  };
}

export function createCustomCharacter(
  name: string, race: Race, charClass: CharClass,
  abilities: AbilityScores, backstory: string
): Character {
  const hp = calculateHP(charClass, abilities.CON, 1);
  return {
    name,
    race,
    class: charClass,
    level: 1,
    xp: 0,
    hp,
    maxHp: hp,
    ac: calculateAC(charClass, abilities.DEX),
    abilities,
    backstory,
    inventory: [...CLASS_INVENTORIES[charClass]],
    gold: 15,
  };
}

export function createCharacterFromPreset(preset: CharacterPreset): Character {
  const hp = calculateHP(preset.class, preset.abilities.CON, 1);
  return {
    name: preset.name,
    race: preset.race,
    class: preset.class,
    level: 1,
    xp: 0,
    hp,
    maxHp: hp,
    ac: calculateAC(preset.class, preset.abilities.DEX),
    abilities: { ...preset.abilities },
    backstory: preset.backstory,
    inventory: [...preset.inventory],
    gold: 15,
  };
}
