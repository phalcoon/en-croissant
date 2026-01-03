import type { Square } from "chessops";
import type { Color, Role } from "chessops/types";
import type { PersonalityConfig } from "./personalityTypes";

/**
 * Unique identifier for a specific piece on the board
 * Based on color, role, and starting square
 */
export interface PieceIdentity {
  color: Color;
  role: Role;
  startSquare: Square;
  assignedPersonality?: string; // Name of the personality variant assigned
}

/**
 * Map of piece identities to their assigned personalities
 * Key format: "white-pawn-e2" or "black-knight-g8"
 */
export type PieceIdentityMap = Map<string, string>;

/**
 * Creates a unique key for a piece based on color, role, and starting square
 */
export function getPieceKey(color: Color, role: Role, square: Square): string {
  return `${color}-${role}-${square}`;
}

/**
 * Personality themes that can be assigned based on opening or game context
 */
export type PersonalityTheme = 
  | "royal"      // King's openings - loyal to the king
  | "aggressive" // Aggressive openings like King's Gambit
  | "italian"    // Italian Game - Italian character
  | "spanish"    // Ruy Lopez - Spanish character
  | "french"     // French Defense - French character
  | "sicilian"   // Sicilian Defense - Sicilian character
  | "scholar"    // Scholar's Mate attempts - academic/studious
  | "defensive"  // Defensive openings
  | "strategic"  // Positional openings like Queen's Gambit
  | "tactical"   // Tactical sharp openings
  | "default";   // No specific theme

/**
 * Maps chess opening names to personality themes
 */
export const OPENING_TO_THEME: Record<string, PersonalityTheme> = {
  // King's Pawn openings
  "King's Pawn": "royal",
  "King's Gambit": "aggressive",
  "King's Indian": "royal",
  
  // Italian
  "Italian Game": "italian",
  "Giuoco Piano": "italian",
  
  // Spanish
  "Ruy Lopez": "spanish",
  "Spanish Game": "spanish",
  
  // French
  "French Defense": "french",
  
  // Sicilian
  "Sicilian Defense": "sicilian",
  "Sicilian": "sicilian",
  
  // Scholar's
  "Scholar's Mate": "scholar",
  
  // Queen's Gambit
  "Queen's Gambit": "strategic",
  "Queen's Pawn": "strategic",
  
  // English
  "English Opening": "strategic",
  
  // Tactical
  "Scotch Game": "tactical",
  "Evans Gambit": "aggressive",
  "Danish Gambit": "aggressive",
};

/**
 * Determines personality theme from opening name
 */
export function getThemeFromOpening(opening: string | undefined): PersonalityTheme {
  if (!opening) return "default";
  
  // Check for exact matches first
  for (const [key, theme] of Object.entries(OPENING_TO_THEME)) {
    if (opening.toLowerCase().includes(key.toLowerCase())) {
      return theme;
    }
  }
  
  return "default";
}

/**
 * Selects a personality variant for a piece based on theme and available personalities
 */
export function selectPersonalityVariant(
  role: Role,
  theme: PersonalityTheme,
  config: PersonalityConfig,
): string {
  const pieceConfig = config.pieces.find(p => p.role === role);
  if (!pieceConfig?.personalities) {
    // Fallback to default if no variants defined
    return "default";
  }
  
  // Find personalities matching the theme
  const themeMatches = pieceConfig.personalities.filter(p => 
    p.theme === theme || (p.theme === "default" && theme === "default")
  );
  
  if (themeMatches.length > 0) {
    // Randomly select from matching themes
    return themeMatches[Math.floor(Math.random() * themeMatches.length)].name;
  }
  
  // Fall back to default theme
  const defaultVariants = pieceConfig.personalities.filter(p => p.theme === "default");
  if (defaultVariants.length > 0) {
    return defaultVariants[0].name;
  }
  
  return "default";
}

/**
 * Initializes the piece start squares map with standard chess starting positions
 */
export function initializeStandardStartSquares(): Map<string, string> {
  const map = new Map<string, string>();
  
  // White pieces
  // Pawns
  for (let file = 0; file < 8; file++) {
    const square = String.fromCharCode(97 + file) + "2";
    map.set(square, square);
  }
  // Pieces
  map.set("a1", "a1"); map.set("h1", "h1"); // Rooks
  map.set("b1", "b1"); map.set("g1", "g1"); // Knights
  map.set("c1", "c1"); map.set("f1", "f1"); // Bishops
  map.set("d1", "d1"); // Queen
  map.set("e1", "e1"); // King
  
  // Black pieces
  // Pawns
  for (let file = 0; file < 8; file++) {
    const square = String.fromCharCode(97 + file) + "7";
    map.set(square, square);
  }
  // Pieces
  map.set("a8", "a8"); map.set("h8", "h8"); // Rooks
  map.set("b8", "b8"); map.set("g8", "g8"); // Knights
  map.set("c8", "c8"); map.set("f8", "f8"); // Bishops
  map.set("d8", "d8"); // Queen
  map.set("e8", "e8"); // King
  
  return map;
}

/**
 * Updates start squares map after a move
 */
export function updateStartSquaresAfterMove(
  startSquares: Map<string, string>,
  fromSquare: string,
  toSquare: string,
  isCapture: boolean,
): void {
  const pieceOrigin = startSquares.get(fromSquare);
  
  if (pieceOrigin) {
    // Move the piece's origin tracking
    startSquares.set(toSquare, pieceOrigin);
    startSquares.delete(fromSquare);
  }
  
  // If capture, remove captured piece's tracking
  if (isCapture) {
    startSquares.delete(toSquare);
  }
}
