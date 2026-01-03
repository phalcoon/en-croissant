import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { fileURLToPath } from 'url';

// Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PERSONALITY_PATH = path.join(process.cwd(), 'public/personalities/standard');
const OUTPUT_DIR = path.join(PERSONALITY_PATH, 'audio');

if (!OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY environment variable is required.');
  console.error('Usage: set OPENAI_API_KEY=sk-... && node scripts/generate_voices.js');
  process.exit(1);
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Voice mapping for different pieces
const VOICE_MAPPING = {
  'king': 'onyx',    // Deep, authoritative
  'queen': 'nova',   // Energetic, feminine
  'rook': 'echo',    // Deep, resonant
  'bishop': 'fable', // British-ish, precise
  'knight': 'alloy', // Neutral, fast
  'pawn': 'shimmer'  // Clear, distinct
};

// Helper to determine piece role from ID or context
function getVoiceForId(id) {
  if (id.includes('king')) return VOICE_MAPPING.king;
  if (id.includes('queen')) return VOICE_MAPPING.queen;
  if (id.includes('rook')) return VOICE_MAPPING.rook;
  if (id.includes('bishop')) return VOICE_MAPPING.bishop;
  if (id.includes('knight')) return VOICE_MAPPING.knight;
  if (id.includes('pawn')) return VOICE_MAPPING.pawn;
  return 'alloy'; // Default
}

async function generateAudio(text, id, voice) {
  const filePath = path.join(OUTPUT_DIR, `${id}.mp3`);
  
  if (fs.existsSync(filePath)) {
    console.log(`Skipping ${id} (already exists)`);
    return;
  }

  console.log(`Generating ${id} with voice ${voice}...`);
  
  try {
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: voice,
      input: text,
    });
    
    const buffer = Buffer.from(await mp3.arrayBuffer());
    await fs.promises.writeFile(filePath, buffer);
    console.log(`Saved ${filePath}`);
  } catch (error) {
    console.error(`Failed to generate ${id}:`, error.message);
  }
}

async function processPersonalityFile(filePath) {
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  for (const personality of content.personalities) {
    console.log(`Processing personality: ${personality.name}`);
    
    for (const response of personality.responses) {
      if (response.text && response.id) {
        // Skip if text contains variables that need runtime substitution
        // Or generate a generic version? For now, we'll generate it with placeholders
        // The game engine might need to handle this, but usually TTS reads the placeholder.
        // Better to replace {capturedPiece} with "piece" for the recording if it's generic.
        
        let textToSpeak = response.text.replace(/{capturedPiece}/g, 'piece');
        
        const voice = getVoiceForId(response.id);
        await generateAudio(textToSpeak, response.id, voice);
      }
    }
  }
}

async function main() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Process white pieces
  const whiteDir = path.join(PERSONALITY_PATH, 'white');
  const files = fs.readdirSync(whiteDir).filter(f => f.endsWith('.json'));
  
  for (const file of files) {
    await processPersonalityFile(path.join(whiteDir, file));
  }
  
  console.log('Done!');
}

main();
