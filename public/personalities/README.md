# Piece Personalities Configuration Guide

This guide explains how to create and customize piece personalities for En Croissant.

## File Structure

Each personality lives in its own folder under `public/personalities/[name]/`:

```
personalities/
  └── [personality-name]/
      ├── config.json          # Main configuration file
      ├── audio/               # Optional audio files for responses
      │   ├── pawn_good_1.mp3
      │   ├── queen_excellent_1.mp3
      │   └── ...
      └── global/              # Optional global audio clips
          ├── brilliant.mp3
          ├── blunder.mp3
          ├── checkmate.mp3
          └── stalemate.mp3
```

## Configuration Format

### Main Configuration (`config.json`)

```json
{
  "name": "personality-name",
  "description": "Description of the personality",
  "contextual": false,
  "pieces": [ /* piece configurations */ ],
  "globalClips": { /* optional global audio */ }
}
```

- **name**: Unique identifier for the personality
- **description**: User-friendly description
- **contextual**: If true, personality can adapt based on opening
- **pieces**: Array of piece personality configurations
- **globalClips**: Optional paths to global audio clips

### Piece Configuration

```json
{
  "role": "pawn",
  "color": "white",  // optional - for color-specific personalities
  "responses": [ /* response configurations */ ]
}
```

**Roles**: `pawn`, `knight`, `bishop`, `rook`, `queen`, `king`

### Response Configuration

```json
{
  "id": "pawn_good_1",
  "text": "Forward march!",
  "conditions": [ /* conditions */ ],
  "weight": 1
}
```

- **id**: Unique identifier (used to map to audio file `audio/[id].mp3`)
- **text**: The text response (used for TTS if no audio available)
- **conditions**: Array of conditions that must ALL match
- **weight**: Relative probability (higher = more likely when multiple match)

## Conditions

All conditions in a response must match for that response to be used.

### Move Quality

Evaluates how good the move was based on engine analysis:

```json
{ 
  "type": "moveQuality",
  "moveQuality": "excellent" | "good" | "neutral" | "dubious" | "bad" | "blunder"
}
```

- **excellent**: Gains >5% win chance
- **good**: Gains >2% win chance
- **neutral**: No significant change
- **dubious**: Loses >5% win chance
- **bad**: Loses >10% win chance
- **blunder**: Loses >20% win chance

### Special Moves

Checks for specific move types:

```json
{
  "type": "specialMove",
  "specialMove": "capture" | "check" | "checkmate" | "castling" | "promotion" | "enPassant" | "sacrifice"
}
```

### Piece Type

Filters by piece role:

```json
{
  "type": "pieceType",
  "pieceType": "pawn" | "knight" | "bishop" | "rook" | "queen" | "king"
}
```

### Opening

Matches if opening name contains the pattern (case-insensitive):

```json
{
  "type": "opening",
  "openingPattern": "italian"
}
```

### Game Phase

Matches based on move count:

```json
{
  "type": "gamePhase",
  "gamePhase": "opening" | "middlegame" | "endgame"
}
```

- **opening**: < 20 half-moves
- **middlegame**: 20-60 half-moves
- **endgame**: > 60 half-moves

### Position

Matches based on destination square:

```json
{
  "type": "position",
  "positionType": "center" | "edge" | "backRank" | "promotion"
}
```

## Audio Files

### Response Audio

- Place audio files in `audio/` folder
- Name them using the response ID: `audio/[response-id].mp3`
- Supported format: MP3
- If audio file is missing, text-to-speech is used automatically

### Global Audio

- Place in `global/` folder
- Referenced in `globalClips` section of config.json
- Used for special situations (brilliant moves, blunders, checkmate, stalemate)

## Example: Creating a New Personality

1. Create folder: `public/personalities/my-personality/`

2. Create `config.json`:
```json
{
  "name": "my-personality",
  "description": "My custom personality",
  "pieces": [
    {
      "role": "pawn",
      "responses": [
        {
          "id": "pawn_move_1",
          "text": "Moving forward!",
          "conditions": [
            { "type": "pieceType", "pieceType": "pawn" }
          ]
        }
      ]
    }
  ]
}
```

3. (Optional) Add audio: `audio/pawn_move_1.mp3`

4. Restart the application - your personality will appear in settings!

## Tips

- Start with simple conditions and add complexity gradually
- Use weights to balance response variety
- Test without audio first (TTS) before recording
- Multiple responses with the same conditions create variety
- Combine conditions for specific situations (e.g., pawn promotion + excellent move)
- Keep response text concise (< 10 words) for better gameplay flow

## Debugging

- Check browser console for loading errors
- Verify JSON syntax with a validator
- Ensure audio files are named exactly as response IDs
- Test each piece type separately

