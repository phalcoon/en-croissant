import type { BestMoves, Score, ScoreValue } from "@/bindings";
import { piecePersonalitiesConfigAtom, piecePersonalityEnabledAtom, piecePersonalityVolumeAtom, piecePersonalityNameAtom } from "@/state/atoms";
import { getDefaultStore } from "jotai";
import type { Color, Piece, Role, Square } from "chessops";
import { parseSquare } from "chessops";
import { getCPLoss, getWinChance, normalizeScore } from "./score";

// Debounce map to prevent rapid-fire personality triggers
const lastTriggerTimes = new Map<string, number>();
const TRIGGER_DEBOUNCE_MS = 2000; // Only trigger once every 2 seconds for same position

// Track if audio is currently playing to prevent interruptions
let isCurrentlyPlaying = false;

/**
 * Represents a condition that must be met for a response to be used
 */
export interface ResponseCondition {
  type: "moveQuality" | "specialMove" | "pieceType" | "opening" | "gamePhase" | "position";
  // Move quality: good, bad, neutral, brilliant, blunder, mistake
  moveQuality?: "excellent" | "good" | "neutral" | "dubious" | "bad" | "blunder";
  // Special moves: fork, pin, sacrifice, check, checkmate, castling, promotion
  specialMove?: "fork" | "pin" | "skewer" | "sacrifice" | "check" | "checkmate" | "castling" | "promotion" | "capture" | "enPassant";
  // Piece type filter
  pieceType?: Role;
  // Opening name pattern (e.g., "italian", "sicilian")
  openingPattern?: string;
  // Game phase: opening, middlegame, endgame
  gamePhase?: "opening" | "middlegame" | "endgame";
  // Position-based (e.g., center, edge, back-rank)
  positionType?: "center" | "edge" | "backRank" | "promotion";
}

/**
 * A response that can be given by a piece
 */
export interface PersonalityResponse {
  // Unique ID for this response (used to map to audio files)
  id: string;
  // The text response
  text: string;
  // Conditions that must be met for this response to be used
  conditions: ResponseCondition[];
  // Weight for random selection (higher = more likely)
  weight?: number;
}

/**
 * Configuration for a piece's personality
 */
export interface PiecePersonality {
  // The role (pawn, knight, bishop, rook, queen, king)
  role: Role;
  // Color of the piece (for color-specific personalities)
  color?: Color;
  // Responses this piece can give
  responses: PersonalityResponse[];
}

/**
 * A complete personality configuration
 */
export interface PersonalityConfig {
  // Name of the personality
  name: string;
  // Description
  description: string;
  // Whether this personality has contextual opening-based behavior
  contextual?: boolean;
  // Piece personalities
  pieces: PiecePersonality[];
  // Global audio clips for special situations (not piece-specific)
  globalClips?: {
    brilliant?: string;
    blunder?: string;
    checkmate?: string;
    stalemate?: string;
  };
}

/**
 * Information about a move for personality evaluation
 */
export interface MoveContext {
  piece: Piece;
  from: Square;
  to: Square;
  san: string;
  isCapture: boolean;
  isCheck: boolean;
  isCheckmate: boolean;
  isCastling: boolean;
  isEnPassant: boolean;
  isPromotion: boolean;
  promotion?: Role;
  prevScore?: ScoreValue;
  currentScore?: ScoreValue;
  color: Color;
  halfMoves: number;
  opening?: string;
  prevBestMoves?: BestMoves[];
  isSacrifice?: boolean;
  getCurrentScore?: () => ScoreValue | undefined; // Callback to get current score from tree
}

/**
 * Evaluates move quality based on score change
 */
function evaluateMoveQuality(
  prevScore: ScoreValue | undefined,
  currentScore: ScoreValue | undefined,
  color: Color,
): ResponseCondition["moveQuality"] {
  // If we don't have both scores yet, return neutral
  if (!prevScore || !currentScore) return "neutral";
  
  const cpLoss = getCPLoss(prevScore, currentScore, color);
  const prevWin = getWinChance(normalizeScore(prevScore, color));
  const currentWin = getWinChance(normalizeScore(currentScore, color));
  const winChanceDiff = prevWin - currentWin;

  // Blunder: lose >20% win chance or >300cp
  if (winChanceDiff > 20 || cpLoss > 300) {
    return "blunder";
  }
  // Mistake: lose >10% win chance or >150cp
  if (winChanceDiff > 10 || cpLoss > 150) {
    return "bad";
  }
  // Dubious: lose >5% win chance or >75cp
  if (winChanceDiff > 5 || cpLoss > 75) {
    return "dubious";
  }
  // Excellent: gain >5% win chance
  if (winChanceDiff < -5) {
    return "excellent";
  }
  // Good: gain >2% win chance
  if (winChanceDiff < -2) {
    return "good";
  }
  
  return "neutral";
}

/**
 * Determines the game phase based on half moves
 */
function getGamePhase(halfMoves: number): ResponseCondition["gamePhase"] {
  if (halfMoves < 20) return "opening";
  if (halfMoves < 60) return "middlegame";
  return "endgame";
}

/**
 * Determines position type of a square
 */
function getPositionType(square: Square): ResponseCondition["positionType"] {
  const rank = Math.floor(square / 8);
  const file = square % 8;
  
  // Back rank
  if (rank === 0 || rank === 7) {
    return "backRank";
  }
  
  // Center (d4, d5, e4, e5)
  if ((file === 3 || file === 4) && (rank === 3 || rank === 4)) {
    return "center";
  }
  
  // Edge
  if (file === 0 || file === 7 || rank === 0 || rank === 7) {
    return "edge";
  }
  
  // Near promotion
  if ((rank === 1 || rank === 6)) {
    return "promotion";
  }
  
  return "center"; // default
}

/**
 * Checks if a condition matches the move context
 */
function conditionMatches(condition: ResponseCondition, context: MoveContext): boolean {
  switch (condition.type) {
    case "moveQuality": {
      if (!condition.moveQuality) return false;
      const quality = evaluateMoveQuality(context.prevScore, context.currentScore!, context.color);
      return quality === condition.moveQuality;
    }
    
    case "specialMove": {
      if (!condition.specialMove) return false;
      switch (condition.specialMove) {
        case "capture":
          return context.isCapture;
        case "check":
          return context.isCheck && !context.isCheckmate;
        case "checkmate":
          return context.isCheckmate;
        case "castling":
          return context.isCastling;
        case "promotion":
          return context.isPromotion;
        case "enPassant":
          return context.isEnPassant;
        case "sacrifice":
          return context.isSacrifice || false;
        // Fork, pin, skewer would require additional position analysis
        // For now, we'll return false
        case "fork":
        case "pin":
        case "skewer":
          return false;
        default:
          return false;
      }
    }
    
    case "pieceType": {
      if (!condition.pieceType) return false;
      return context.piece.role === condition.pieceType;
    }
    
    case "opening": {
      if (!condition.openingPattern || !context.opening) return false;
      return context.opening.toLowerCase().includes(condition.openingPattern.toLowerCase());
    }
    
    case "gamePhase": {
      if (!condition.gamePhase) return false;
      return getGamePhase(context.halfMoves) === condition.gamePhase;
    }
    
    case "position": {
      if (!condition.positionType) return false;
      return getPositionType(context.to) === condition.positionType;
    }
    
    default:
      return false;
  }
}

/**
 * Finds matching responses for a move
 */
function findMatchingResponses(
  personality: PiecePersonality,
  context: MoveContext,
): PersonalityResponse[] {
  return personality.responses.filter((response) => {
    // All conditions must match
    return response.conditions.every((condition) => conditionMatches(condition, context));
  });
}

/**
 * Selects a random response based on weights
 */
function selectWeightedResponse(responses: PersonalityResponse[]): PersonalityResponse | null {
  if (responses.length === 0) return null;
  
  const totalWeight = responses.reduce((sum, r) => sum + (r.weight || 1), 0);
  let random = Math.random() * totalWeight;
  
  for (const response of responses) {
    random -= response.weight || 1;
    if (random <= 0) {
      return response;
    }
  }
  
  return responses[responses.length - 1];
}

/**
 * Speaks text using Web Speech API
 */
function speakText(text: string, volume: number, pieceRole?: Role): void {
  if ('speechSynthesis' in window) {
    // Don't cancel - let current speech finish if playing
    // This prevents interruptions during engine analysis
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = volume;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    // Select voice based on piece role
    if (pieceRole === 'queen') {
      // Try to find a female voice for the queen
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('female') ||
        voice.name.toLowerCase().includes('woman') ||
        voice.name.toLowerCase().includes('zira') ||
        voice.name.toLowerCase().includes('hazel') ||
        voice.name.toLowerCase().includes('samantha') ||
        voice.name.toLowerCase().includes('victoria') ||
        voice.name.toLowerCase().includes('karen') ||
        voice.name.toLowerCase().includes('susan') ||
        voice.name.toLowerCase().includes('amelie') ||
        voice.name.toLowerCase().includes('anna')
      );
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
    }
    
    // Clear flag when speech ends
    utterance.onend = () => {
      isCurrentlyPlaying = false;
    };
    
    utterance.onerror = () => {
      isCurrentlyPlaying = false;
    };
    
    window.speechSynthesis.speak(utterance);
  }
}

/**
 * Plays audio file for a response
 */
async function playAudioResponse(
  personalityName: string,
  responseId: string,
  volume: number,
): Promise<boolean> {
  try {
    const audioPath = `/personalities/${personalityName}/audio/${responseId}.mp3`;
    const audio = new Audio(audioPath);
    audio.volume = volume;
    await audio.play();
    return true;
  } catch (error) {
    // Audio file doesn't exist or failed to play
    return false;
  }
}

/**
 * Main function to trigger a piece personality response
 */
export async function triggerPiecePersonality(context: MoveContext): Promise<void> {
  const store = getDefaultStore();
  const enabled = store.get(piecePersonalityEnabledAtom);
  
  if (!enabled) return;
  
  // Don't interrupt currently playing audio
  if (isCurrentlyPlaying) {
    return;
  }
  
  // Debounce: Check if we recently triggered for this move
  const posKey = `${context.from}-${context.to}-${context.san}`;
  const now = Date.now();
  const lastTrigger = lastTriggerTimes.get(posKey);
  if (lastTrigger && now - lastTrigger < TRIGGER_DEBOUNCE_MS) {
    return; // Skip this trigger, too soon after last one
  }
  lastTriggerTimes.set(posKey, now);
  
  // Clean up old entries (keep only last 50)
  if (lastTriggerTimes.size > 50) {
    const entries = Array.from(lastTriggerTimes.entries());
    entries.sort((a, b) => a[1] - b[1]);
    for (let i = 0; i < 20; i++) {
      lastTriggerTimes.delete(entries[i][0]);
    }
  }
  
  const volume = store.get(piecePersonalityVolumeAtom);
  const config = store.get(piecePersonalitiesConfigAtom);
  
  if (!config) return;
  
  // Try to get current score from the callback if provided
  let evaluatedContext = context;
  if (context.getCurrentScore && !context.currentScore) {
    const currentScore = context.getCurrentScore();
    if (currentScore !== undefined) {
      evaluatedContext = {
        ...context,
        currentScore,
      };
    }
  }
  
  // Find personality for this piece
  const personality = config.pieces.find(
    (p: PiecePersonality) => p.role === evaluatedContext.piece.role && (!p.color || p.color === evaluatedContext.color)
  );
  
  if (!personality) return;
  
  // Find matching responses
  const matchingResponses = findMatchingResponses(personality, evaluatedContext);
  
  if (matchingResponses.length === 0) return;
  
  // Select a response
  const response = selectWeightedResponse(matchingResponses);
  
  if (!response) return;
  
  // Mark as playing
  isCurrentlyPlaying = true;
  
  // Try to play audio, fall back to TTS
  const audioPlayed = await playAudioResponse(config.name, response.id, volume);
  
  if (!audioPlayed) {
    // Use text-to-speech as fallback with piece-specific voice
    speakText(response.text, volume, evaluatedContext.piece.role);
    // Give TTS time to start before allowing next trigger
    setTimeout(() => {
      isCurrentlyPlaying = false;
    }, 500);
  } else {
    // Audio played, reset flag after short delay
    setTimeout(() => {
      isCurrentlyPlaying = false;
    }, 500);
  }
}

/**
 * Plays a global audio clip for special situations
 */
export async function playGlobalClip(
  clipType: keyof NonNullable<PersonalityConfig["globalClips"]>,
): Promise<void> {
  const store = getDefaultStore();
  const enabled = store.get(piecePersonalityEnabledAtom);
  
  if (!enabled) return;
  
  const volume = store.get(piecePersonalityVolumeAtom);
  const config = store.get(piecePersonalitiesConfigAtom);
  
  if (!config?.globalClips?.[clipType]) return;
  
  const clipPath = `/personalities/${config.name}/global/${config.globalClips[clipType]}`;
  
  try {
    const audio = new Audio(clipPath);
    audio.volume = volume;
    await audio.play();
  } catch (error) {
    // Clip doesn't exist or failed to play
    console.warn(`Failed to play global clip: ${clipType}`);
  }
}

/**
 * Loads a personality configuration from a JSON file
 */
export async function loadPersonalityConfig(name: string): Promise<PersonalityConfig | null> {
  try {
    const response = await fetch(`/personalities/${name}/config.json`);
    if (!response.ok) return null;
    const config = await response.json();
    
    // Store in atom for use by the system
    const store = getDefaultStore();
    store.set(piecePersonalitiesConfigAtom, config);
    
    return config;
  } catch (error) {
    console.error(`Failed to load personality config: ${name}`, error);
    return null;
  }
}

/**
 * Gets list of available personalities
 */
export async function getAvailablePersonalities(): Promise<string[]> {
  // This would need to be populated from a manifest or directory listing
  // For now, return hardcoded list
  return ["standard", "italian"];
}

/**
 * Initialize personality system on app load
 */
export async function initializePersonalitySystem(): Promise<void> {
  const store = getDefaultStore();
  const personalityName: string = store.get(piecePersonalityNameAtom);
  
  if (personalityName) {
    await loadPersonalityConfig(personalityName);
  }
}
