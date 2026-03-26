import { ElevenLabsClient, play } from '@elevenlabs/elevenlabs-js';

const elevenlabs = new ElevenLabsClient({
    apiKey: "YOUR_API_KEY", // Defaults to process.env.ELEVENLABS_API_KEY
});

const audio = await elevenlabs.textToSpeech.convert(
  'JBFqnCBsd6RMkjVDRZzb', // voice_id
  {
    text: 'Neural network pa, oru complex system, adhu human brain function la inspire aaguthu. Ithu machine learning la use pannuvangga, computer odane oru nalla decision eduthukku.',
    modelId: 'eleven_multilingual_v2',
    outputFormat: 'mp3_44100_128', // output_format
  }
);

await play(audio);