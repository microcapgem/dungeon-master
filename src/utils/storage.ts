import type { GameState, RosterCharacter, CampaignRecord } from '../game/state';
import type { ProviderType } from '../ai/provider';

const GAME_STATE_KEY = 'aidm_game_state';
const SETTINGS_KEY = 'aidm_settings';
const SAVES_INDEX_KEY = 'aidm_saves_index';
const ROSTER_KEY = 'aidm_character_roster';

export interface AppSettings {
  providerType: ProviderType;
  claudeApiKey: string;
  openaiApiKey: string;
  openaiModel: string;
  elevenLabsApiKey: string;
  elevenLabsVoiceId: string;
  showMechanics: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  providerType: 'claude',
  claudeApiKey: '',
  openaiApiKey: '',
  openaiModel: 'gpt-5.2',
  elevenLabsApiKey: '',
  elevenLabsVoiceId: 'pNInz6obpgDQGcFmaJgB',  // "Adam" — deep, narration-style voice
  showMechanics: true,
};

// ============ Auto-save (current session) ============

export function saveGameState(state: GameState): void {
  try {
    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save game state:', e);
  }
}

export function loadGameState(): GameState | null {
  try {
    const data = localStorage.getItem(GAME_STATE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function clearGameState(): void {
  localStorage.removeItem(GAME_STATE_KEY);
}

// ============ Named save slots ============

export interface SaveSlot {
  id: string;
  name: string;
  characterName: string;
  characterClass: string;
  level: number;
  location: string;
  timestamp: number;
  storyLength: number;
}

function getSavesIndex(): SaveSlot[] {
  try {
    const data = localStorage.getItem(SAVES_INDEX_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function setSavesIndex(index: SaveSlot[]): void {
  localStorage.setItem(SAVES_INDEX_KEY, JSON.stringify(index));
}

export function listSaves(): SaveSlot[] {
  return getSavesIndex().sort((a, b) => b.timestamp - a.timestamp);
}

export function createSave(name: string, state: GameState): SaveSlot {
  const id = `save_${Date.now()}`;
  const slot: SaveSlot = {
    id,
    name,
    characterName: state.character?.name || 'Unknown',
    characterClass: state.character?.class || 'unknown',
    level: state.character?.level || 1,
    location: state.location,
    timestamp: Date.now(),
    storyLength: state.storyLog.length,
  };

  // Save the actual game state
  localStorage.setItem(`aidm_${id}`, JSON.stringify(state));

  // Update the index
  const index = getSavesIndex();
  index.push(slot);
  setSavesIndex(index);

  return slot;
}

export function loadSave(id: string): GameState | null {
  try {
    const data = localStorage.getItem(`aidm_${id}`);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function deleteSave(id: string): void {
  localStorage.removeItem(`aidm_${id}`);
  const index = getSavesIndex().filter(s => s.id !== id);
  setSavesIndex(index);
}

export function overwriteSave(id: string, name: string, state: GameState): SaveSlot {
  const slot: SaveSlot = {
    id,
    name,
    characterName: state.character?.name || 'Unknown',
    characterClass: state.character?.class || 'unknown',
    level: state.character?.level || 1,
    location: state.location,
    timestamp: Date.now(),
    storyLength: state.storyLog.length,
  };

  localStorage.setItem(`aidm_${id}`, JSON.stringify(state));

  const index = getSavesIndex().map(s => s.id === id ? slot : s);
  setSavesIndex(index);

  return slot;
}

// ============ Character Roster ============

export function loadRoster(): RosterCharacter[] {
  try {
    const data = localStorage.getItem(ROSTER_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveRoster(roster: RosterCharacter[]): void {
  try {
    localStorage.setItem(ROSTER_KEY, JSON.stringify(roster));
  } catch (e) {
    console.error('Failed to save roster:', e);
  }
}

export function addToRoster(rosterChar: RosterCharacter): void {
  const roster = loadRoster();
  roster.push(rosterChar);
  saveRoster(roster);
}

export function updateRosterCharacter(id: string, updates: Partial<Pick<RosterCharacter, 'character' | 'campaignHistory'>>): void {
  const roster = loadRoster();
  const idx = roster.findIndex(r => r.id === id);
  if (idx === -1) return;
  if (updates.character) roster[idx].character = updates.character;
  if (updates.campaignHistory) roster[idx].campaignHistory = updates.campaignHistory;
  saveRoster(roster);
}

export function addCampaignToRoster(rosterId: string, campaign: CampaignRecord, updatedCharacter: import('../game/character').Character): void {
  const roster = loadRoster();
  const idx = roster.findIndex(r => r.id === rosterId);
  if (idx === -1) return;
  roster[idx].campaignHistory.push(campaign);
  roster[idx].character = updatedCharacter;
  saveRoster(roster);
}

export function getRosterCharacter(id: string): RosterCharacter | null {
  const roster = loadRoster();
  return roster.find(r => r.id === id) || null;
}

export function deleteRosterCharacter(id: string): void {
  const roster = loadRoster().filter(r => r.id !== id);
  saveRoster(roster);
}

// ============ Settings ============

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadSettings(): AppSettings {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}
