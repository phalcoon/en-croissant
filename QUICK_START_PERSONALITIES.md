# Quick Start: Piece Personalities

## Enable the Feature (30 seconds)

1. Open **Settings** by pressing **F5** or clicking the gear icon
2. Click on the **Piece Personalities** tab (smiley face icon)
3. Toggle **Enable Piece Personalities** to **ON**
4. Select a personality style (Standard or Italian)
5. Adjust volume if needed
6. Close settings and start playing!

## What to Expect

When you move a piece, it will respond based on the quality of your move:

- **Good moves** → Positive, encouraging responses
- **Bad moves** → Concerned or disappointed responses  
- **Special moves** (captures, checks, castling) → Unique responses
- **Neutral moves** → Calm, steady responses

## Examples

### Standard Personality (Professional)
- Pawn: "Forward march!" (good move)
- Knight: "Hop, skip, and jump!" (good move)
- Queen: "Magnificent!" (excellent move)
- King: "I may have walked into danger." (bad move)

### Italian Personality (Expressive)
- Pawn: "Avanti! Forward!" (good move)
- Knight: "Bellissimo! A beautiful jump!" (good move)
- Queen: "Stupendo! Magnificent!" (excellent move)
- King: "Pericoloso! Too dangerous!" (bad move)

## Audio vs Text-to-Speech

The system will:
1. **First**: Try to play audio file if it exists
2. **Fallback**: Use text-to-speech to speak the response

This means the feature works immediately without any audio files!

## Volume Control

Two separate volume controls:
- **Sound Volume**: Game sounds (moves, captures)
- **Personality Volume**: Piece responses (voice/audio)

Adjust them independently in Settings → Sound and Settings → Piece Personalities.

## Disable the Feature

Simply toggle **Enable Piece Personalities** to **OFF** in settings.

## Create Your Own Personality

See `/public/personalities/README.md` for a complete guide on creating custom personalities.

Basic steps:
1. Create a folder in `public/personalities/[your-name]/`
2. Add a `config.json` file with responses
3. (Optional) Add MP3 audio files
4. Update the manifest
5. Restart the app

## Troubleshooting

**Q: I don't hear anything**
- Check that **Enable Piece Personalities** is ON
- Check **Personality Volume** is not at 0
- Ensure your system volume is up
- Try making a move (only your pieces speak)

**Q: Responses don't match my moves**
- Enable engine analysis for move quality evaluation
- Some responses require specific conditions (game phase, opening, etc.)

**Q: Can I turn off just some pieces?**
- Not directly, but you can create a custom personality with only responses for pieces you want

**Q: Does this work for both players?**
- Currently only your own pieces respond (the side you're moving)

**Q: Can pieces speak in other languages?**
- Yes! Create a custom personality with responses in any language

## Tips

- Try different personality styles to find your favorite
- The Italian personality is more expressive and fun
- Standard personality is professional and balanced
- Make intentionally bad moves to hear the disappointed responses
- Check the documentation to create your own personality style

## Need Help?

- Full documentation: `PIECE_PERSONALITIES.md`
- Configuration guide: `public/personalities/README.md`
- Example configs: `public/personalities/standard/` and `italian/`

Enjoy your chess pieces' new personalities! 🎭♟️

