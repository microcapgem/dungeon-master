import type { Character } from './character';
import type { DiceResult } from './dice';

export type GamePhase = 'setup' | 'character-select' | 'character-create' | 'playing' | 'combat' | 'game-over';

export interface Enemy {
  name: string;
  hp: number;
  maxHp: number;
  ac: number;
}

export interface CombatState {
  enemies: Enemy[];
  playerTurn: boolean;
  round: number;
  deathSaves: { successes: number; failures: number };
}

export interface StoryEntry {
  id: string;
  type: 'dm' | 'player' | 'system' | 'roll';
  text: string;
  timestamp: number;
  rollResult?: DiceResult;
}

export interface CampaignRecord {
  id: string;
  title: string;
  summary: string;
  location: string;
  questsCompleted: string[];
  npcsMet: string[];
  startDate: number;
  endDate: number;
  storyLog: StoryEntry[];
}

export interface RosterCharacter {
  id: string;
  character: Character;
  campaignHistory: CampaignRecord[];
  createdAt: number;
}

export interface GameState {
  phase: GamePhase;
  character: Character | null;
  storyLog: StoryEntry[];
  combat: CombatState | null;
  questLog: string[];
  location: string;
  npcsMetNames: string[];
  sessionId: string;
  rosterId: string | null;
  campaignStartDate: number | null;
}

export type GameAction =
  | { type: 'SET_PHASE'; phase: GamePhase }
  | { type: 'SET_CHARACTER'; character: Character }
  | { type: 'ADD_STORY'; entry: StoryEntry }
  | { type: 'TAKE_DAMAGE'; amount: number }
  | { type: 'HEAL'; amount: number }
  | { type: 'GAIN_XP'; amount: number }
  | { type: 'ADD_ITEM'; item: string }
  | { type: 'REMOVE_ITEM'; item: string }
  | { type: 'ADD_GOLD'; amount: number }
  | { type: 'START_COMBAT'; enemies: Enemy[] }
  | { type: 'END_COMBAT' }
  | { type: 'ENEMY_TAKE_DAMAGE'; index: number; amount: number }
  | { type: 'SET_PLAYER_TURN'; isPlayerTurn: boolean }
  | { type: 'NEXT_ROUND' }
  | { type: 'DEATH_SAVE'; success: boolean }
  | { type: 'UPDATE_LOCATION'; location: string }
  | { type: 'ADD_NPC'; name: string }
  | { type: 'ADD_QUEST'; quest: string }
  | { type: 'LOAD_STATE'; state: GameState }
  | { type: 'NEW_GAME' };

export function createInitialState(): GameState {
  return {
    phase: 'setup',
    character: null,
    storyLog: [],
    combat: null,
    questLog: [],
    location: 'Unknown',
    npcsMetNames: [],
    sessionId: crypto.randomUUID(),
    rosterId: null,
    campaignStartDate: null,
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_PHASE':
      return { ...state, phase: action.phase };

    case 'SET_CHARACTER':
      return { ...state, character: action.character, campaignStartDate: state.campaignStartDate || Date.now() };

    case 'ADD_STORY':
      return { ...state, storyLog: [...state.storyLog, action.entry] };

    case 'TAKE_DAMAGE': {
      if (!state.character) return state;
      const newHp = Math.max(0, state.character.hp - action.amount);
      return {
        ...state,
        character: { ...state.character, hp: newHp },
        phase: newHp === 0 && state.phase === 'combat' ? 'combat' : state.phase,
      };
    }

    case 'HEAL': {
      if (!state.character) return state;
      const healed = Math.min(state.character.maxHp, state.character.hp + action.amount);
      return { ...state, character: { ...state.character, hp: healed } };
    }

    case 'GAIN_XP': {
      if (!state.character) return state;
      return { ...state, character: { ...state.character, xp: state.character.xp + action.amount } };
    }

    case 'ADD_ITEM': {
      if (!state.character) return state;
      return { ...state, character: { ...state.character, inventory: [...state.character.inventory, action.item] } };
    }

    case 'REMOVE_ITEM': {
      if (!state.character) return state;
      const idx = state.character.inventory.indexOf(action.item);
      if (idx === -1) return state;
      const inv = [...state.character.inventory];
      inv.splice(idx, 1);
      return { ...state, character: { ...state.character, inventory: inv } };
    }

    case 'ADD_GOLD': {
      if (!state.character) return state;
      return { ...state, character: { ...state.character, gold: state.character.gold + action.amount } };
    }

    case 'START_COMBAT':
      return {
        ...state,
        phase: 'combat',
        combat: { enemies: action.enemies, playerTurn: true, round: 1, deathSaves: { successes: 0, failures: 0 } },
      };

    case 'END_COMBAT':
      return { ...state, phase: 'playing', combat: null };

    case 'ENEMY_TAKE_DAMAGE': {
      if (!state.combat) return state;
      const enemies = state.combat.enemies.map((e, i) =>
        i === action.index ? { ...e, hp: Math.max(0, e.hp - action.amount) } : e
      );
      return { ...state, combat: { ...state.combat, enemies } };
    }

    case 'SET_PLAYER_TURN':
      if (!state.combat) return state;
      return { ...state, combat: { ...state.combat, playerTurn: action.isPlayerTurn } };

    case 'NEXT_ROUND':
      if (!state.combat) return state;
      return { ...state, combat: { ...state.combat, round: state.combat.round + 1, playerTurn: true } };

    case 'DEATH_SAVE': {
      if (!state.combat) return state;
      const ds = { ...state.combat.deathSaves };
      if (action.success) ds.successes++;
      else ds.failures++;
      return { ...state, combat: { ...state.combat, deathSaves: ds } };
    }

    case 'UPDATE_LOCATION':
      return { ...state, location: action.location };

    case 'ADD_NPC':
      if (state.npcsMetNames.includes(action.name)) return state;
      return { ...state, npcsMetNames: [...state.npcsMetNames, action.name] };

    case 'ADD_QUEST':
      return { ...state, questLog: [...state.questLog, action.quest] };

    case 'LOAD_STATE':
      return action.state;

    case 'NEW_GAME':
      return createInitialState();

    default:
      return state;
  }
}
