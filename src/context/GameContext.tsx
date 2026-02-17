import { createContext, useContext, useReducer, useEffect, useCallback, useRef, useState, type ReactNode } from 'react';
import type { GameState, GameAction, StoryEntry } from '../game/state';
import { gameReducer, createInitialState } from '../game/state';
import type { AIProvider } from '../ai/provider';
import { ClaudeProvider } from '../ai/claude';
import { OpenAIProvider } from '../ai/openai';
import type { AppSettings } from '../utils/storage';
import { loadSettings, saveSettings, saveGameState, loadGameState } from '../utils/storage';
import { buildDMSystemPrompt, buildRollResultMessage } from '../ai/prompts';
import type { DiceResult } from '../game/dice';
import type { Message } from '../ai/provider';
import { speakDM } from '../utils/voice';

export interface PendingRoll {
  type: string;
  dice: string;
  modifier: number;
  reason: string;
  dc?: number;
}

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  settings: AppSettings;
  updateSettings: (s: Partial<AppSettings>) => void;
  sendPlayerAction: (action: string) => Promise<void>;
  sendRollResult: (result: DiceResult, dc?: number) => Promise<void>;
  isAIResponding: boolean;
  streamingText: string;
  pendingRoll: PendingRoll | null;
  setPendingRoll: (roll: PendingRoll | null) => void;
  suggestedActions: string[];
}

const GameContext = createContext<GameContextValue | null>(null);

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be inside GameProvider');
  return ctx;
}

function getProvider(settings: AppSettings): AIProvider {
  if (settings.providerType === 'claude') {
    return new ClaudeProvider(settings.claudeApiKey);
  }
  return new OpenAIProvider(settings.openaiApiKey, settings.openaiModel);
}

// Robust JSON extraction — handles markdown code fences, partial JSON, etc.
function extractJSON(text: string): any {
  // Try 1: direct parse
  try { return JSON.parse(text.trim()); } catch {}

  // Try 2: extract from markdown code fence
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1].trim()); } catch {}
  }

  // Try 3: find the outermost { ... } block
  let depth = 0;
  let start = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (text[i] === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        try { return JSON.parse(text.slice(start, i + 1)); } catch {}
      }
    }
  }

  return null;
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [state, dispatch] = useReducer(gameReducer, null, () => {
    const saved = loadGameState();
    return saved || createInitialState();
  });
  const [isAIResponding, setIsAIResponding] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [pendingRoll, setPendingRoll] = useState<PendingRoll | null>(null);
  const [suggestedActions, setSuggestedActions] = useState<string[]>([]);
  const messageHistory = useRef<Message[]>([]);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Auto-save game state
  useEffect(() => {
    if (state.phase !== 'setup') {
      saveGameState(state);
    }
  }, [state]);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial };
      saveSettings(next);
      return next;
    });
  }, []);

  const processAIResponse = useCallback((responseText: string) => {
    const json = extractJSON(responseText);

    if (!json) {
      // No JSON found — treat entire response as narrative
      return {
        narrative: responseText.replace(/```[\s\S]*?```/g, '').trim(),
        suggestedActions: ['Look around', 'Continue forward', 'Check inventory'],
        rollRequest: null,
        gameUpdates: null,
      };
    }

    // Process game updates
    if (json.gameUpdates) {
      const u = json.gameUpdates;
      if (u.damage) dispatch({ type: 'TAKE_DAMAGE', amount: u.damage });
      if (u.healing) dispatch({ type: 'HEAL', amount: u.healing });
      if (u.xp) dispatch({ type: 'GAIN_XP', amount: u.xp });
      if (u.gold) dispatch({ type: 'ADD_GOLD', amount: u.gold });
      if (u.addItems) u.addItems.forEach((item: string) => dispatch({ type: 'ADD_ITEM', item }));
      if (u.removeItems) u.removeItems.forEach((item: string) => dispatch({ type: 'REMOVE_ITEM', item }));
      if (u.location) dispatch({ type: 'UPDATE_LOCATION', location: u.location });
      if (u.newNPC) dispatch({ type: 'ADD_NPC', name: u.newNPC });
      if (u.quest) dispatch({ type: 'ADD_QUEST', quest: u.quest });
      if (u.startCombat) dispatch({ type: 'START_COMBAT', enemies: u.startCombat });
      if (u.endCombat) dispatch({ type: 'END_COMBAT' });
      if (u.enemyDamage) dispatch({ type: 'ENEMY_TAKE_DAMAGE', index: u.enemyDamage.index, amount: u.enemyDamage.amount });
    }

    return {
      narrative: json.narrative || responseText,
      suggestedActions: json.suggestedActions || ['Continue...'],
      rollRequest: json.rollRequest || null,
      gameUpdates: json.gameUpdates || null,
    };
  }, [dispatch]);

  const sendToAI = useCallback(async (userMessage: string) => {
    const provider = getProvider(settings);
    if (!provider.isConfigured()) {
      dispatch({
        type: 'ADD_STORY',
        entry: { id: crypto.randomUUID(), type: 'system', text: 'Please configure your AI provider in Settings first.', timestamp: Date.now() },
      });
      return;
    }

    setIsAIResponding(true);
    setStreamingText('');
    setSuggestedActions([]);

    messageHistory.current.push({ role: 'user', content: userMessage });

    // Keep message history manageable (last 30 messages)
    if (messageHistory.current.length > 30) {
      messageHistory.current = messageHistory.current.slice(-30);
    }

    try {
      let fullResponse = '';
      const systemPrompt = buildDMSystemPrompt(stateRef.current);

      for await (const chunk of provider.streamMessage(messageHistory.current, systemPrompt)) {
        fullResponse += chunk;
        setStreamingText(fullResponse);
      }

      messageHistory.current.push({ role: 'assistant', content: fullResponse });

      const parsed = processAIResponse(fullResponse);

      // Add DM narrative to story log + speak it
      if (parsed.narrative) {
        const entry: StoryEntry = {
          id: crypto.randomUUID(),
          type: 'dm',
          text: parsed.narrative,
          timestamp: Date.now(),
        };
        dispatch({ type: 'ADD_STORY', entry });
        speakDM(parsed.narrative);
      }

      // Set suggested actions for the UI
      if (parsed.suggestedActions && parsed.suggestedActions.length > 0) {
        setSuggestedActions(parsed.suggestedActions);
      }

      // Handle roll requests
      if (parsed.rollRequest) {
        setPendingRoll(parsed.rollRequest);
      }

      setStreamingText('');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      dispatch({
        type: 'ADD_STORY',
        entry: { id: crypto.randomUUID(), type: 'system', text: `Error: ${errorMsg}`, timestamp: Date.now() },
      });
      setStreamingText('');
    } finally {
      setIsAIResponding(false);
    }
  }, [settings, processAIResponse]);

  const sendPlayerAction = useCallback(async (action: string) => {
    dispatch({
      type: 'ADD_STORY',
      entry: { id: crypto.randomUUID(), type: 'player', text: action, timestamp: Date.now() },
    });
    setSuggestedActions([]);
    await sendToAI(action);
  }, [sendToAI]);

  const sendRollResult = useCallback(async (result: DiceResult, dc?: number) => {
    const rollText = `Rolled ${result.values.join(', ')} + ${result.roll.modifier} = ${result.total}${dc ? ` (DC ${dc}: ${result.total >= dc ? 'Success!' : 'Failure!'})` : ''}`;
    dispatch({
      type: 'ADD_STORY',
      entry: { id: crypto.randomUUID(), type: 'roll', text: `${result.roll.reason}: ${rollText}`, timestamp: Date.now(), rollResult: result },
    });

    setPendingRoll(null);
    const msg = buildRollResultMessage(result.roll.reason, result.total, result.values, dc);
    await sendToAI(msg);
  }, [sendToAI]);

  return (
    <GameContext.Provider value={{
      state, dispatch, settings, updateSettings,
      sendPlayerAction, sendRollResult,
      isAIResponding, streamingText,
      pendingRoll, setPendingRoll,
      suggestedActions,
    }}>
      {children}
    </GameContext.Provider>
  );
}
