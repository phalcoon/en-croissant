import type { TreeNode } from "./treeReducer";

/**
 * Opening patterns defined by move sequences
 * Format: "move1 move2 move3..." -> "Opening Name"
 */
const OPENING_PATTERNS: Record<string, string> = {
  // King's Pawn Games
  "e4 e5": "King's Pawn Game",
  "e4 e5 Nf3": "King's Pawn Opening",
  "e4 e5 Nf3 Nc6": "King's Knight Opening",
  
  // Italian Game
  "e4 e5 Nf3 Nc6 Bc4": "Italian Game",
  "e4 e5 Nf3 Nc6 Bc4 Bc5": "Giuoco Piano",
  "e4 e5 Nf3 Nc6 Bc4 Nf6": "Two Knights Defense",
  
  // Spanish/Ruy Lopez
  "e4 e5 Nf3 Nc6 Bb5": "Ruy Lopez",
  "e4 e5 Nf3 Nc6 Bb5 a6": "Ruy Lopez, Morphy Defense",
  
  // Sicilian Defense
  "e4 c5": "Sicilian Defense",
  "e4 c5 Nf3": "Sicilian Defense",
  "e4 c5 Nf3 d6": "Sicilian Defense, Old Sicilian",
  "e4 c5 Nf3 Nc6": "Sicilian Defense, Old Sicilian",
  "e4 c5 Nf3 e6": "Sicilian Defense, French Variation",
  
  // French Defense
  "e4 e6": "French Defense",
  "e4 e6 d4": "French Defense",
  "e4 e6 d4 d5": "French Defense",
  
  // Caro-Kann
  "e4 c6": "Caro-Kann Defense",
  "e4 c6 d4": "Caro-Kann Defense",
  
  // Scandinavian
  "e4 d5": "Scandinavian Defense",
  
  // Alekhine's Defense
  "e4 Nf6": "Alekhine's Defense",
  
  // Queen's Pawn Games
  "d4 d5": "Queen's Pawn Game",
  "d4 d5 c4": "Queen's Gambit",
  "d4 d5 c4 e6": "Queen's Gambit Declined",
  "d4 d5 c4 c6": "Queen's Gambit, Slav Defense",
  "d4 d5 c4 dxc4": "Queen's Gambit Accepted",
  
  // Indian Defenses
  "d4 Nf6": "Indian Defense",
  "d4 Nf6 c4": "Indian Defense",
  "d4 Nf6 c4 e6": "Indian Defense",
  "d4 Nf6 c4 g6": "King's Indian Defense",
  "d4 Nf6 c4 e6 Nc3 Bb4": "Nimzo-Indian Defense",
  
  // English Opening
  "c4": "English Opening",
  "c4 e5": "English Opening, Reversed Sicilian",
  "c4 Nf6": "English Opening",
  "c4 c5": "English Opening, Symmetrical",
  
  // Réti Opening
  "Nf3": "Réti Opening",
  "Nf3 d5": "Réti Opening",
  "Nf3 Nf6": "Réti Opening",
  
  // Bird's Opening
  "f4": "Bird's Opening",
  
  // Other common openings
  "e4 e5 f4": "King's Gambit",
  "e4 e5 Nc3": "Vienna Game",
  "e4 e5 Bc4": "Bishop's Opening",
  "d4 f5": "Dutch Defense",
  "e4 Nc6": "Nimzowitsch Defense",
};

/**
 * Detects chess opening from move sequence
 * Traverses the game tree and builds a SAN move list to match against patterns
 */
export function detectOpening(root: TreeNode): string | undefined {
  // Build move sequence from mainline (first variation)
  const moves: string[] = [];
  let currentNode = root;
  
  // Limit to first 10 moves (20 ply) for opening detection
  const maxMoves = 10;
  
  while (currentNode.children.length > 0 && moves.length < maxMoves) {
    const firstChild = currentNode.children[0];
    if (firstChild.san) {
      moves.push(firstChild.san);
    }
    currentNode = firstChild;
  }
  
  if (moves.length === 0) {
    return undefined;
  }
  
  // Debug: Log the move sequence we're trying to match
  console.log('[Opening Detection - Move Sequence]', moves.join(' '));
  
  // Try to match progressively longer sequences (longest match wins)
  let bestMatch: string | undefined = undefined;
  let bestMatchLength = 0;
  
  for (let i = moves.length; i > 0; i--) {
    const sequence = moves.slice(0, i).join(" ");
    const opening = OPENING_PATTERNS[sequence];
    
    if (opening && i > bestMatchLength) {
      bestMatch = opening;
      bestMatchLength = i;
      console.log('[Opening Detection - Match Found]', { sequence, opening });
    }
  }
  
  if (!bestMatch) {
    console.log('[Opening Detection - No Match]', 'No opening pattern matched');
  }
  
  return bestMatch;
}

/**
 * Detects opening and updates it if more moves have been played
 * Returns the most specific opening found based on current position
 */
export function updateOpeningDetection(
  root: TreeNode,
  currentOpening?: string
): string | undefined {
  const detectedOpening = detectOpening(root);
  
  // Always return what we detect from the current position
  // If nothing matches, return undefined (not the old opening)
  return detectedOpening;
}
