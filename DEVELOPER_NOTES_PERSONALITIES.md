# Developer Notes: Piece Personalities System

## Architecture Overview

The piece personality system is designed as a modular, configuration-driven feature that integrates with the existing chess move processing pipeline.

### Key Design Principles

1. **Non-Invasive**: Minimal changes to existing code
2. **Async by Default**: No blocking of game operations
3. **Graceful Degradation**: Works without audio, TTS, or analysis
4. **Type-Safe**: Full TypeScript with proper type definitions
5. **Extensible**: Easy to add new condition types or features

## Code Organization

### Core Logic (`src/utils/piecePersonality.ts`)

**Main Functions:**
- `triggerPiecePersonality()` - Entry point for move responses
- `evaluateMoveQuality()` - Converts engine scores to quality ratings
- `conditionMatches()` - Evaluates if a condition matches move context
- `findMatchingResponses()` - Filters responses by conditions
- `selectWeightedResponse()` - Random selection with weights
- `playAudioResponse()` - Attempts audio playback
- `speakText()` - TTS fallback
- `loadPersonalityConfig()` - Loads and caches config
- `playGlobalClip()` - Special situation clips

**Types:**
- `PersonalityConfig` - Complete personality definition
- `PiecePersonality` - Per-piece configuration
- `PersonalityResponse` - Individual response with conditions
- `ResponseCondition` - Condition that must match
- `MoveContext` - All info about a move for evaluation

### Integration Point (`src/state/store/tree.ts`)

**Modified Function:** `makeMove()`
- Collects move context information
- Triggers personality asynchronously (non-blocking)
- Only on user moves (not during analysis/replay)
- Calls `triggerPiecePersonality()` and `playGlobalClip()`

### State Management (`src/state/atoms.ts`)

**Atoms:**
```typescript
piecePersonalityEnabledAtom: boolean  // Feature toggle
piecePersonalityVolumeAtom: number    // Volume (0-1)
piecePersonalityNameAtom: string      // Current personality ID
piecePersonalitiesConfigAtom: any     // Loaded config (runtime only)
```

### UI Components

**`PersonalitySelect.tsx`:**
- Loads manifest.json on mount
- Dynamically populates personality options
- Auto-loads config on selection
- Updates piecePersonalitiesConfigAtom

**`PersonalityVolumeSlider.tsx`:**
- Simple slider (0-100%)
- Matches existing VolumeSlider pattern

**`SettingsPage.tsx`:**
- Added new tab with smiley icon
- Three settings rows (enable, volume, style)
- Consistent with existing settings patterns

## Data Flow

```
User Makes Move
    ↓
tree.ts: makeMove()
    ↓
Collect MoveContext
    ↓
triggerPiecePersonality() [async]
    ↓
Check enabled atom → Check config atom
    ↓
Find matching responses
    ↓
Select weighted response
    ↓
Try playAudioResponse()
    ↓
If fails → speakText() [TTS]
```

## Configuration Format

### File Structure
```
public/personalities/
  ├── manifest.json           # Registry of all personalities
  └── [personality-id]/
      ├── config.json          # Main config
      ├── audio/               # Optional MP3 files
      └── global/              # Optional special clips
```

### Validation
- No runtime validation currently (assumes valid JSON)
- Future: Add JSON schema validation
- Future: Add config linter/validator tool

### Loading Strategy
- Lazy loading: Config loaded on personality selection
- Cached in atom after loading
- Re-loaded on personality change

## Condition Evaluation

### Move Quality Algorithm
```typescript
CPLoss > 300 || WinChance loss > 20% → Blunder
CPLoss > 150 || WinChance loss > 10% → Bad  
CPLoss > 75  || WinChance loss > 5%  → Dubious
WinChance gain > 5%  → Excellent
WinChance gain > 2%  → Good
Otherwise            → Neutral
```

### Condition Matching
- **ALL** conditions in a response must match
- Evaluated in order: moveQuality, specialMove, pieceType, opening, gamePhase, position
- Short-circuit evaluation: First non-match exits
- Case-insensitive string matching for opening patterns

### Response Selection
- Filter to only matching responses
- If none match, return early (no response)
- If multiple match, use weighted random selection
- Weight default: 1 (equal probability)
- Higher weight = more likely to be selected

## Audio System

### File Loading
```typescript
Audio file: /personalities/[name]/audio/[response-id].mp3
Global clip: /personalities/[name]/global/[filename].mp3
```

### Playback Logic
1. Create new Audio() instance
2. Set source path
3. Set volume from atom
4. Call play()
5. Catch errors silently (missing file)
6. Return success/failure boolean

### TTS Fallback
```typescript
if (!audioPlayed) {
  window.speechSynthesis.speak(utterance)
}
```

### Web Speech API
- Uses default system voice
- Rate: 1.0 (normal speed)
- Pitch: 1.0 (normal)
- Volume: From atom
- Cancel previous speech before new

## Performance Considerations

### Async Operations
- Audio playback: Non-blocking
- TTS: Non-blocking  
- Config loading: Async with loading state
- Move processing: Not delayed by personalities

### Memory Usage
- One config loaded at a time
- Audio files: Loaded on-demand by browser
- No caching beyond single config
- Garbage collected when personality changes

### Throttling
- Inherited from existing move throttling
- No additional throttling needed
- Responses naturally limited to one per move

## Error Handling

### Missing Audio Files
- Try/catch around audio playback
- Fall back to TTS silently
- No error shown to user
- Log to console for debugging

### Invalid Config
- Currently: Will fail on access
- Future: Add try/catch around config parsing
- Future: Show error in settings if invalid

### Missing Manifest
- Component falls back to hardcoded list
- Console warning logged
- Feature still works with defaults

### TTS Not Available
- Feature degrades to no audio
- No error shown (graceful silence)
- Check: `'speechSynthesis' in window`

## Testing Strategy

### Unit Tests (Future)
- `evaluateMoveQuality()` with various scores
- `conditionMatches()` for each condition type
- `selectWeightedResponse()` distribution
- `findMatchingResponses()` filtering logic

### Integration Tests (Future)
- Load config from file
- Play audio file
- TTS fallback
- Settings persistence

### Manual Testing
- See IMPLEMENTATION_SUMMARY.md for checklist
- Test each personality
- Test all condition types
- Test audio and TTS paths

## Extension Points

### Adding New Condition Types

1. Add to `ResponseCondition` interface:
```typescript
export interface ResponseCondition {
  type: "moveQuality" | "specialMove" | ... | "newType";
  newProperty?: string;
}
```

2. Add case to `conditionMatches()`:
```typescript
case "newType": {
  if (!condition.newProperty) return false;
  return /* evaluation logic */;
}
```

3. Update documentation

### Adding New Move Context

1. Add to `MoveContext` interface
2. Populate in `makeMove()` function
3. Use in condition evaluation

### Adding New Audio Sources

1. Extend `PersonalityConfig` with new paths
2. Create new playback function
3. Call from `triggerPiecePersonality()`

## Debugging Tips

### Enable Console Logging
```typescript
// In piecePersonality.ts, add:
console.log("Triggering personality for", context.piece.role);
console.log("Matching responses:", matchingResponses.length);
console.log("Selected:", response?.id);
```

### Test Audio Loading
```javascript
// In browser console:
new Audio('/personalities/standard/audio/pawn_good_1.mp3').play()
```

### Test TTS
```javascript
// In browser console:
speechSynthesis.speak(new SpeechSynthesisUtterance("Test"))
```

### Verify Atom Values
```typescript
// In any component:
import { useAtomValue } from "jotai";
const enabled = useAtomValue(piecePersonalityEnabledAtom);
console.log("Enabled:", enabled);
```

## Known Limitations

1. **No Fork/Pin Detection**: Requires deeper position analysis
2. **No Contextual Opening Switch**: Opening field not populated yet
3. **Single Config Loaded**: Can't blend personalities
4. **No Visual Feedback**: Only audio/text output
5. **One Language TTS**: Uses system default voice
6. **No Response History**: Each move independent

## Future Improvements

### High Priority
- [ ] Add JSON schema validation
- [ ] Populate opening name in move context
- [ ] Add error boundaries around personality code
- [ ] Cache audio files for performance
- [ ] Add loading indicator for config

### Medium Priority
- [ ] Visual indicators (piece speech bubbles)
- [ ] Response history/replay
- [ ] Personality mixing/blending
- [ ] Community sharing platform
- [ ] In-app personality editor

### Low Priority
- [ ] Voice customization for TTS
- [ ] Response timing controls
- [ ] Personality achievements/unlocks
- [ ] Statistical response tracking
- [ ] AI-generated responses

## Breaking Changes to Avoid

When modifying this system:

1. **Don't change config.json format** without migration
2. **Don't change atom names** (breaks persisted settings)
3. **Don't make personality loading blocking**
4. **Don't break without audio files**
5. **Don't interfere with move processing**

## Maintenance Checklist

Before releasing personality updates:
- [ ] Test all included personalities
- [ ] Verify manifest.json is valid
- [ ] Check all documentation is up to date
- [ ] Test with audio files missing
- [ ] Test TTS fallback works
- [ ] Verify settings persist
- [ ] Check console for errors
- [ ] Test on different browsers

## Related Code

Files that interact with this system:
- `src/utils/sound.ts` - Game sound system (separate)
- `src/utils/score.ts` - Move evaluation logic
- `src/state/store/tree.ts` - Move processing
- `src/components/settings/SettingsPage.tsx` - Settings UI

## Questions for Future Development

1. Should personalities be per-player or per-side?
2. Should opponent pieces also speak?
3. Should analysis mode trigger personalities?
4. Should there be visual indicators?
5. Should responses queue or overlap?
6. Should there be response cooldowns?
7. Should opening names be auto-detected?
8. Should engine be required for quality eval?

## Contact

For questions about this system:
- See implementation in `src/utils/piecePersonality.ts`
- Check documentation in `PIECE_PERSONALITIES.md`
- Review examples in `public/personalities/`

