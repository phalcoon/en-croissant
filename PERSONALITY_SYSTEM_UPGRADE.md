# Personality System Upgrade - Individual Piece Personalities

## Overview
Upgrading from generic piece-type personalities to individual piece personalities with opening-influenced assignments.

## Current State
- ✅ Basic personality system with TTS/audio
- ✅ Move quality detection (excellent, good, neutral, dubious, bad, blunder)
- ✅ One personality per piece TYPE (all pawns share same personality)

## Target State  
- Each individual piece (e.g., "white pawn on e2") gets its own unique personality
- Personalities assigned on first move, persist for the game
- Opening influences which personality variants are available
- Multiple personality variants per piece type (e.g., "peasant pawn", "warrior pawn", "Italian pawn")

## Implementation Status

### ✅ Completed
1. **pieceIdentity.ts** - Core identity tracking system
   - `getPieceKey()` - Creates unique keys like "white-pawn-e2"
   - `PersonalityTheme` type - royal, aggressive, italian, spanish, etc.
   - `OPENING_TO_THEME` - Maps openings to themes
   - `getThemeFromOpening()` - Determines theme from opening name
   - `selectPersonalityVariant()` - Selects variant based on theme

2. **Updated Types in piecePersonality.ts**
   - `PersonalityVariant` interface - Defines a personality variant
   - `PiecePersonality.personalities` - Optional array of variants
   - `MoveContext.pieceKey` - Unique piece identifier
   - `MoveContext.startSquare` - Original square

3. **Atoms (atoms.ts)**
   - `pieceIdentityMapFamily` - Tracks piece -> personality mappings per tab
   - `currentOpeningAtomFamily` - Tracks current opening per tab

### 🚧 TODO

#### 1. Update Config Format
Create example config with personality variants:
```json
{
  "pieces": [
    {
      "role": "pawn",
      "personalities": [
        {
          "name": "peasant",
          "theme": "royal",
          "description": "A humble servant loyal to the king",
          "responses": [
            {
              "id": "peasant_pawn_excellent",
              "text": "For the glory of the king!",
              "conditions": [...]
            }
          ]
        },
        {
          "name": "italian",
          "theme": "italian",
          "description": "Passionate Italian fighter",
          "responses": [
            {
              "id": "italian_pawn_excellent",
              "text": "Mamma mia! Perfetto!",
              "conditions": [...]
            }
          ]
        }
      ]
    }
  ]
}
```

#### 2. Update tree.ts makeMove()
- Track piece start squares (need to detect if first move)
- Get opening name from tree state/headers
- Pass start square and opening to personality trigger
- **Key Challenge**: Need to track where each piece started the game

####3. Update piecePersonality.ts triggerPiecePersonality()
- Check if piece already has assigned personality (use pieceIdentityMapFamily)
- If not assigned:
  - Get current opening from currentOpeningAtomFamily
  - Determine theme from opening
  - Select personality variant
  - Store assignment in pieceIdentityMapFamily
- Load responses from assigned variant instead of generic piece responses
- Use pieceKey for all lookups

#### 4. Opening Detection
- Extract opening name from tree headers or analysis
- Update currentOpeningAtomFamily when opening detected
- Opening should be available early (first few moves)

#### 5. Piece Start Square Tracking
**This is the hardest part!**

Options:
A) Track in separate atom: `pieceStartSquaresFamily` - Map<Square, Square> (current -> start)
B) Add to tree node: Store piece movements in tree
C) Recalculate from game history: Replay moves to determine original squares

Recommended: Option A - Simple map that tracks "where is this piece from originally"
- Initialize with standard chess starting positions
- Update when pieces move
- Handle promotions (new piece, new start square)
- Handle captures (remove from map)

#### 6. Reset on New Game
- Clear pieceIdentityMapFamily when tab resets or new game starts
- Clear currentOpeningAtomFamily
- Clear pieceStartSquaresFamily

### File Changes Required

**s:\\Coding\\chess\\en-croissant\\src\\utils\\piecePersonality.ts**
- Import pieceIdentity utilities
- Update `triggerPiecePersonality()`:
  - Add piece identity checking/assignment logic
  - Load variant-specific responses
  - Handle first-move assignment

**s:\\Coding\\chess\\en-croissant\\src\\state\\store\\tree.ts**
- Track piece start squares
- Pass opening name to makeMove context
- Initialize piece tracking on new game

**s:\\Coding\\chess\\en-croissant\\src\\state\\atoms.ts**
- ✅ Already added pieceIdentityMapFamily
- ✅ Already added currentOpeningAtomFamily  
- TODO: Add pieceStartSquaresFamily

**s:\\Coding\\chess\\en-croissant\\public\\personalities\\standard\\config.json**
- Add personality variants for each piece type
- Create themed responses (royal, italian, spanish, etc.)

### Testing Plan
1. Start new game → verify all pieces unassigned
2. Play King's Pawn opening → e2 pawn should get "royal" theme personality
3. Make multiple moves with same pawn → should keep same personality
4. Start new Italian Game → pieces involved should get "italian" theme
5. Verify different pawns have different dialogue

### Notes
- Need to handle promotions carefully (promoted pawn becomes new piece)
- Captures remove pieces from tracking
- En passant edge case (capturing piece)
- Castling moves two pieces at once
- Opening detection should happen early (moves 1-5typically)

## Next Steps
1. Create pieceStartSquaresFamily atom
2. Initialize standard starting positions
3. Update makeMove() to track piece origins
4. Update triggerPiecePersonality() with assignment logic
5. Create example personality variants in config
6. Test with real games
