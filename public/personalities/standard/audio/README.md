# Audio Files

Place your MP3 audio files in this directory.

## Naming Convention

Audio files should be named exactly as the response ID in the config.json file.

For example, if a response has:
```json
{
  "id": "pawn_good_1",
  "text": "Forward march!",
  ...
}
```

The audio file should be named: `pawn_good_1.mp3`

## Format

- **Format**: MP3
- **Sample Rate**: 44.1 kHz recommended
- **Bit Rate**: 128 kbps or higher
- **Channels**: Mono or Stereo
- **Duration**: Keep responses short (1-3 seconds) for best gameplay flow

## Recording Tips

1. Use a quality microphone
2. Record in a quiet environment
3. Keep consistent volume levels
4. Add slight room tone to avoid abrupt starts/ends
5. Normalize audio levels across all files
6. Test in-game to ensure appropriate length

## Text-to-Speech Fallback

If an audio file is not found, the system will automatically use text-to-speech to speak the response text. This means:
- Audio files are **optional**
- You can test personalities before recording audio
- Users can play without downloading large audio packs

