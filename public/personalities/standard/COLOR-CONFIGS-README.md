# Color-Specific Personality Configurations

This folder now supports separate dialogue for white and black pieces!

## File Structure

- **config-white.json** - Dialogue for white pieces (assertive, leading, attacking)
- **config-black.json** - Dialogue for black pieces (defensive, reactive, countering)
- **config.json** - (Legacy) Unified config for both colors

## How It Works

The system automatically:
1. Tries to load `config-white.json` and `config-black.json`
2. Merges them into a single config with color-specific responses
3. Falls back to `config.json` if color-specific files don't exist

## White vs Black Personalities

### White Pieces
- **Tone**: Confident, assertive, taking initiative
- **Perspective**: "Leading the charge", "Breaking through", "Press the attack"
- **Role**: First mover advantage, building pressure

### Black Pieces  
- **Tone**: Defensive, reactive, resilient
- **Perspective**: "Holding the line", "Counterattacking", "Defending the realm"
- **Role**: Responding to threats, finding counter-chances

## Benefits

1. **Clarity**: Each color has distinct personality reflecting their game position
2. **Expansion**: Easy to add more responses without navigating huge files
3. **Testing**: Test white/black dialogue separately
4. **Realism**: Matches chess psychology (initiative vs counter-play)

## Adding More Pieces

Currently only pawns are implemented in the color-specific configs. To add more:

1. Copy a piece block from the old `config.json`
2. Add `"color": "white"` to the piece object
3. Rewrite dialogue to match white's perspective
4. Do the same for black with `"color": "black"`

Example:
```json
{
  "role": "knight",
  "color": "white",
  "responses": [],
  "personalities": [...]
}
```
