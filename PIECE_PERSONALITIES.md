# Piece Personalities Feature

## Overview

The Piece Personalities feature gives individual personality to every chess piece in En Croissant. Each piece responds when moved, with responses that vary based on:

- **Move quality** (good, bad, neutral, brilliant, blunder)
- **Special moves** (captures, checks, castling, promotions, sacrifices)
- **Opening context** (pieces can adopt personality based on opening played)
- **Game phase** (opening, middlegame, endgame)
- **Position** (center, edge, back rank)

## Features

✅ **Configurable Personalities**: Choose from multiple personality styles  
✅ **Audio Support**: Play custom audio clips for each response  
✅ **Text-to-Speech Fallback**: Automatic TTS when audio files aren't available  
✅ **Contextual Responses**: Pieces respond based on move quality and situation  
✅ **Easy Expansion**: Add new personalities without recompiling code  
✅ **Simple File Format**: JSON configuration with response conditions  
✅ **Sound File Indexing**: Tie sound files to responses via simple filename matching  
✅ **GUI Configuration**: Toggle on/off and configure via settings panel  

## How It Works

### 1. Move Evaluation

When a piece is moved, the system:
1. Analyzes the move quality using the chess engine evaluation
2. Identifies special move types (capture, check, sacrifice, etc.)
3. Determines game context (opening, phase, position)

### 2. Response Selection

The system:
1. Finds the moved piece's personality configuration
2. Filters responses where ALL conditions match
3. Randomly selects from matching responses (weighted by importance)

### 3. Audio Playback

The system:
1. Attempts to play audio file at `/personalities/[name]/audio/[response-id].mp3`
2. Falls back to text-to-speech if audio file doesn't exist
3. Respects volume settings for personalities

## Usage

### Enabling the Feature

1. Open **Settings** (gear icon or F5)
2. Navigate to **Piece Personalities** tab
3. Toggle **Enable Piece Personalities** to ON
4. Adjust **Personality Volume** as desired
5. Select a **Personality Style** (Standard, Italian, etc.)

### Creating Custom Personalities

See `/public/personalities/README.md` for detailed instructions on creating custom personality configurations.

Quick steps:
1. Create folder: `public/personalities/my-personality/`
2. Add `config.json` with piece responses and conditions
3. (Optional) Add audio files to `audio/` folder
4. Restart En Croissant - personality appears in settings!

## File Structure

```
public/
  └── personalities/
      ├── README.md                    # Configuration guide
      ├── standard/                    # Standard personality
      │   ├── config.json
      │   ├── audio/                   # Optional audio files
      │   └── global/                  # Optional global clips
      └── italian/                     # Italian personality
          ├── config.json
          ├── audio/
          └── global/
```

## Configuration Format

### Personality Config (`config.json`)

```json
{
  "name": "my-personality",
  "description": "Description of personality",
  "contextual": false,
  "pieces": [
    {
      "role": "pawn",
      "responses": [
        {
          "id": "pawn_good_1",
          "text": "Forward march!",
          "conditions": [
            { "type": "moveQuality", "moveQuality": "good" },
            { "type": "pieceType", "pieceType": "pawn" }
          ],
          "weight": 1
        }
      ]
    }
  ]
}
```

### Condition Types

- **moveQuality**: excellent, good, neutral, dubious, bad, blunder
- **specialMove**: capture, check, checkmate, castling, promotion, sacrifice
- **pieceType**: pawn, knight, bishop, rook, queen, king
- **opening**: matches opening name (e.g., "italian", "sicilian")
- **gamePhase**: opening, middlegame, endgame
- **position**: center, edge, backRank, promotion

### Audio Files

Place audio files in `audio/[response-id].mp3`

Example:
- Config has response ID: `"pawn_good_1"`
- Audio file: `audio/pawn_good_1.mp3`

## Included Personalities

### Standard
Balanced, respectful personality suitable for all players. Pieces give polite, professional responses based on move quality.

### Italian
Passionate and expressive personality with Italian flair. Pieces use Italian phrases and show more emotion:
- "Magnifico!" for excellent moves
- "Mamma mia!" for mistakes
- "Avanti!" when advancing

## Technical Details

### Implementation

- **State Management**: Jotai atoms for settings storage
- **Move Integration**: Hooks into `makeMove` function in tree state
- **Evaluation**: Uses existing engine score analysis
- **Audio**: Web Audio API for playback
- **TTS**: Web Speech Synthesis API for fallback

### Files Added

- `src/utils/piecePersonality.ts` - Core personality engine
- `src/components/settings/PersonalitySelect.tsx` - Personality selector
- `src/components/settings/PersonalityVolumeSlider.tsx` - Volume control
- `public/personalities/` - Personality configurations and audio

### Files Modified

- `src/state/atoms.ts` - Added personality atoms
- `src/state/store/tree.ts` - Integrated personality triggers
- `src/components/settings/SettingsPage.tsx` - Added settings panel
- `src/translation/en_US.ts` - Added translation keys

## Performance Considerations

- Responses are triggered asynchronously (non-blocking)
- Audio files are loaded on-demand
- TTS fallback prevents missing audio from breaking gameplay
- Throttling prevents multiple simultaneous responses

## Future Enhancements

Potential additions:
- Fork/pin/skewer detection for specialized responses
- Context-aware personalities that adapt to openings
- Community personality sharing
- Voice customization for TTS
- Additional languages and dialects
- Visual indicators for piece emotions

## Troubleshooting

### Personalities Not Working
1. Check that **Enable Piece Personalities** is toggled ON
2. Verify personality config file exists and is valid JSON
3. Check browser console for errors
4. Ensure volume is not set to 0

### No Audio Playing
1. Check that audio files exist in correct location
2. Verify filenames match response IDs exactly
3. Check file format is MP3
4. TTS should work as fallback if audio missing

### Responses Not Matching Expectations
1. Review condition configuration in config.json
2. Remember ALL conditions must match for a response
3. Check weights for response selection probability
4. Enable engine analysis to get move quality evaluation

## Credits

Designed to enhance the En Croissant chess experience with personality and character while maintaining code maintainability and user configurability.

