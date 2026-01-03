# Personality Debug Logging

## Overview

Comprehensive debug logging has been added to the piece personality system to help developers and users understand exactly how dialogs are selected and why certain move qualities are assigned.

## What's Logged

When a piece personality dialog is triggered, the following information is now logged to the browser console:

### 1. **Dialog Information**
- **Dialog Text**: The actual text that is spoken or played
- **Dialog ID**: The unique identifier for the response (used for audio file mapping)

### 2. **Piece Information**
- **Piece Type**: Color and role (e.g., "white pawn")
- **Piece Key**: Unique identifier for piece tracking (e.g., "white-pawn-e2")
- **Personality Variant**: The specific personality assigned to this piece (e.g., "peasant", "italian", "fortress")

### 3. **Move Quality Analysis**
- **Move Quality**: The assigned quality (excellent, good, neutral, dubious, bad, blunder)
- **Detailed Explanation**: Full breakdown including:
  - Previous position evaluation and win percentage
  - Current position evaluation and win percentage
  - Centipawn loss
  - Win chance change percentage
  - Exact reason why the quality was selected

### 4. **Selection Process**
- **Matching Responses**: How many responses matched the conditions
- **Selected Weight**: The weight of the chosen response
- **Total Weight**: Sum of all matching response weights

### 5. **Move Context**
- **Squares**: From and to squares
- **SAN Notation**: Standard algebraic notation
- **Special Moves**: Capture, check, castling, promotion flags
- **Opening**: Current opening name (if detected)
- **Game Phase**: Opening, middlegame, or endgame

### 6. **Conditions Met**
- List of all conditions that matched for the selected response

## Example Console Output

```
🎭 [Personality Dialog] white pawn
  📜 Dialog Text: "Forward march!"
  🎯 Dialog ID: pawn_good_1
  👤 Piece: white pawn (white-pawn-e2)
  🎨 Personality Variant: peasant
  ⭐ Move Quality: good
  📊 Quality Explanation: Previous: 50cp (52.3% win chance) | Current: 85cp (58.7% win chance) | CP Loss: 0.0 | Win Chance Change: +6.4% | → GOOD (gained 6.4% win chance (>2%))
  🎲 Selection Process: {matchingResponses: 3, selectedWeight: 1, totalWeight: 3}
  🔍 Move Context: {from: 12, to: 28, san: "e4", isCapture: false, isCheck: false, isCastling: false, isPromotion: false, opening: "Italian Game", gamePhase: "opening"}
  🎯 Conditions Met: ["Quality: good"]
```

## Move Quality Thresholds

The system uses the following thresholds to determine move quality:

| Quality | Criteria |
|---------|----------|
| **Blunder** | Lost >20% win chance OR lost >300 centipawns |
| **Bad** | Lost >10% win chance OR lost >150 centipawns |
| **Dubious** | Lost >5% win chance OR lost >75 centipawns |
| **Neutral** | Win chance change within ±2% and <75cp loss |
| **Good** | Gained >2% win chance |
| **Excellent** | Gained >5% win chance |

## When Logging Occurs

Debug logs are generated:
- ✅ **When a dialog is selected and played** - Full details
- ✅ **When no matching responses found** - Shows why no dialog was triggered
- ✅ **When personality variants are assigned** - First time a piece moves
- ✅ **When personality configs are loaded** - At startup or personality change

## How to Use

### Enable Console Logging
1. Open your browser's Developer Tools (F12)
2. Navigate to the Console tab
3. Play a game with Piece Personalities enabled
4. Watch the logs appear after each move

### Filter Logs
You can filter console output by typing in the filter box:
- `Personality Dialog` - Only show dialog selections
- `Personality Debug` - Show all personality-related logs
- `Personality No Match` - Only show when no dialog matched

### Understanding Quality Explanations

The quality explanation shows:
1. **Previous evaluation**: The position evaluation before the move
2. **Current evaluation**: The position evaluation after the move
3. **CP Loss**: How many centipawns were lost (0 = no loss, positive = loss)
4. **Win Chance Change**: Percentage change in winning probability
5. **Reason**: Exactly which threshold triggered the quality assignment

## Benefits

This debug logging helps with:
- **Understanding** why certain dialogs are triggered
- **Debugging** personality configurations
- **Creating** new personalities (see what conditions match)
- **Tuning** move quality thresholds
- **Learning** chess evaluation concepts
- **Troubleshooting** when dialogs don't appear as expected

## Technical Details

### Implementation Location
All logging is implemented in `src/utils/piecePersonality.ts`:
- `explainMoveQuality()` function (lines ~178-230)
- `triggerPiecePersonality()` function debug section (lines ~579-620)

### Performance Impact
The logging has minimal performance impact:
- Only executes when personalities are enabled
- Uses efficient console.group() for collapsible logs
- No blocking operations
- Calculations are already performed for move evaluation

### Production Considerations
These logs are helpful for:
- **Development**: Understanding the system
- **Testing**: Verifying personality behavior
- **User Support**: Diagnosing issues

In production, you may want to:
- Keep them enabled (users can close console)
- Wrap in `if (DEBUG_MODE)` checks
- Remove entirely if concerned about performance

## Related Documentation

- [PIECE_PERSONALITIES.md](./PIECE_PERSONALITIES.md) - Overall personality system
- [DEVELOPER_NOTES_PERSONALITIES.md](./DEVELOPER_NOTES_PERSONALITIES.md) - Technical details
- [public/personalities/README.md](./public/personalities/README.md) - Creating custom personalities
