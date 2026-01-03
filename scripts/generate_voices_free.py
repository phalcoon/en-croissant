import os
import json
import asyncio
import edge_tts

# Configuration
PERSONALITY_PATH = os.path.join(os.getcwd(), 'public', 'personalities', 'standard')
OUTPUT_DIR = os.path.join(PERSONALITY_PATH, 'audio')

# Voice Mapping (Microsoft Edge Neural Voices)
# Themes map to specific voice sets to provide accents/variations
THEME_MAPPING = {
    'default': {
        'king': 'en-GB-RyanNeural',      # Deep, authoritative, British
        'queen': 'en-GB-SoniaNeural',    # Clear, polite, British
        'rook': 'en-US-ChristopherNeural', # Deep, calm
        'bishop': 'en-GB-ThomasNeural',  # Formal, precise
        'knight': 'en-US-GuyNeural',     # Energetic, standard male
        'pawn': 'en-US-AnaNeural'        # Young, lighter
    },
    'italian': {
        'default': 'it-IT-DiegoNeural',   # Italian Male (will read English with accent)
        'queen': 'it-IT-ElsaNeural'       # Italian Female
    },
    'french': {
        'default': 'fr-FR-HenriNeural',   # French Male
        'queen': 'fr-FR-DeniseNeural'     # French Female
    },
    'sicilian': {
        'default': 'it-IT-IsabellaNeural', # Sicilian/Italian Female
        'bishop': 'it-IT-DiegoNeural'      # Sicilian/Italian Male
    },
    'royal': { # Cleric/Royal
        'default': 'en-GB-RyanNeural',
        'bishop': 'en-IE-ConnorNeural'     # Irish accent for the Cleric
    },
    'russian': {
        'default': 'ru-RU-DmitryNeural',
        'queen': 'ru-RU-SvetlanaNeural'
    }
}

DEFAULT_MAPPING = THEME_MAPPING['default']

def get_voice_for_personality(personality_name, personality_theme, response_id):
    # Determine role from ID
    role = 'pawn'
    if 'king' in response_id: role = 'king'
    elif 'queen' in response_id: role = 'queen'
    elif 'rook' in response_id: role = 'rook'
    elif 'bishop' in response_id: role = 'bishop'
    elif 'knight' in response_id: role = 'knight'
    
    # Determine theme key
    theme_key = 'default'
    p_name = personality_name.lower()
    p_theme = personality_theme.lower()
    
    if 'italian' in p_name or 'italian' in p_theme:
        theme_key = 'italian'
    elif 'french' in p_name or 'french' in p_theme:
        theme_key = 'french'
    elif 'sicilian' in p_name or 'sicilian' in p_theme:
        theme_key = 'sicilian'
    elif 'cleric' in p_name or 'royal' in p_theme:
        theme_key = 'royal'
    elif 'russian' in p_name or 'russian' in p_theme:
        theme_key = 'russian'
        
    # Look up voice
    theme_voices = THEME_MAPPING.get(theme_key, DEFAULT_MAPPING)
    
    # Try specific role, then default for theme, then fallback to global default for role
    return theme_voices.get(role, theme_voices.get('default', DEFAULT_MAPPING.get(role, 'en-US-AriaNeural')))

async def generate_audio(text, response_id, voice):
    output_file = os.path.join(OUTPUT_DIR, f"{response_id}.mp3")
    
    if os.path.exists(output_file):
        print(f"Skipping {response_id} (already exists)")
        return

    print(f"Generating {response_id} with voice {voice}...")
    
    try:
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(output_file)
    except Exception as e:
        print(f"Failed to generate {response_id}: {e}")

async def process_personality_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = json.load(f)
    
    tasks = []
    for personality in content.get('personalities', []):
        p_name = personality.get('name', 'default')
        p_theme = personality.get('theme', 'default')
        print(f"Processing personality: {p_name} ({p_theme})")
        
        for response in personality.get('responses', []):
            if 'text' in response and 'id' in response:
                # Replace variables for recording
                text_to_speak = response['text'].replace('{capturedPiece}', 'piece')
                
                voice = get_voice_for_personality(p_name, p_theme, response['id'])
                tasks.append(generate_audio(text_to_speak, response['id'], voice))
    
    # Run in batches to avoid overwhelming the service
    batch_size = 5
    for i in range(0, len(tasks), batch_size):
        batch = tasks[i:i + batch_size]
        await asyncio.gather(*batch)

async def main():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    white_dir = os.path.join(PERSONALITY_PATH, 'white')
    if not os.path.exists(white_dir):
        print(f"Directory not found: {white_dir}")
        return

    files = [f for f in os.listdir(white_dir) if f.endswith('.json')]
    
    for file in files:
        await process_personality_file(os.path.join(white_dir, file))
    
    print("Done!")

if __name__ == "__main__":
    asyncio.run(main())
