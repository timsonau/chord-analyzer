// Frequency ranges for each note (in Hz) - optimized for vocal range
const NOTE_FREQUENCIES: Record<string, [number, number]> = {
  // Lower octave (2)
  'C2': [65.41 - 2, 65.41 + 2],
  'C#2': [69.30 - 2, 69.30 + 2],
  'D2': [73.42 - 2, 73.42 + 2],
  'D#2': [77.78 - 2, 77.78 + 2],
  'E2': [82.41 - 2, 82.41 + 2],
  'F2': [87.31 - 2, 87.31 + 2],
  'F#2': [92.50 - 2, 92.50 + 2],
  'G2': [98.00 - 2, 98.00 + 2],
  'G#2': [103.83 - 2, 103.83 + 2],
  'A2': [110.00 - 2, 110.00 + 2],
  'A#2': [116.54 - 2, 116.54 + 2],
  'B2': [123.47 - 2, 123.47 + 2],
  
  // Middle octave (3) - most common for vocals
  'C3': [130.81 - 3, 130.81 + 3],
  'C#3': [138.59 - 3, 138.59 + 3],
  'D3': [146.83 - 3, 146.83 + 3],
  'D#3': [155.56 - 3, 155.56 + 3],
  'E3': [164.81 - 3, 164.81 + 3],
  'F3': [174.61 - 3, 174.61 + 3],
  'F#3': [185.00 - 3, 185.00 + 3],
  'G3': [196.00 - 3, 196.00 + 3],
  'G#3': [207.65 - 3, 207.65 + 3],
  'A3': [220.00 - 3, 220.00 + 3],
  'A#3': [233.08 - 3, 233.08 + 3],
  'B3': [246.94 - 3, 246.94 + 3],
  
  // Higher octave (4)
  'C4': [261.63 - 4, 261.63 + 4],
  'C#4': [277.18 - 4, 277.18 + 4],
  'D4': [293.66 - 4, 293.66 + 4],
  'D#4': [311.13 - 4, 311.13 + 4],
  'E4': [329.63 - 4, 329.63 + 4],
  'F4': [349.23 - 4, 349.23 + 4],
  'F#4': [369.99 - 4, 369.99 + 4],
  'G4': [392.00 - 4, 392.00 + 4],
  'G#4': [415.30 - 4, 415.30 + 4],
  'A4': [440.00 - 4, 440.00 + 4],
  'A#4': [466.16 - 4, 466.16 + 4],
  'B4': [493.88 - 4, 493.88 + 4],
  
  // Highest octave (5) - for high voices
  'C5': [523.25 - 5, 523.25 + 5],
  'C#5': [554.37 - 5, 554.37 + 5],
  'D5': [587.33 - 5, 587.33 + 5],
  'D#5': [622.25 - 5, 622.25 + 5],
  'E5': [659.26 - 5, 659.26 + 5],
  'F5': [698.46 - 5, 698.46 + 5],
  'F#5': [739.99 - 5, 739.99 + 5],
  'G5': [783.99 - 5, 783.99 + 5],
  'G#5': [830.61 - 5, 830.61 + 5],
  'A5': [880.00 - 5, 880.00 + 5],
  'A#5': [932.33 - 5, 932.33 + 5],
  'B5': [987.77 - 5, 987.77 + 5],
};

export interface PitchInfo {
  note: string // The note name with octave (e.g., 'A4')
  frequency: number // The detected frequency in Hz
  magnitude: number // The volume/strength of the note (0-255)
  octave: number // The octave number
  cents: number // Cents deviation from perfect pitch (-50 to +50)
}

// Helper function to calculate cents deviation
function calculateCents(detectedFreq: number, perfectFreq: number): number {
  return Math.round(1200 * Math.log2(detectedFreq / perfectFreq));
}

// Detect the current pitch from frequency data
export function detectPitch(
  frequencyData: Uint8Array,
  fftSize: number,
  sampleRate: number
): PitchInfo | null {
  let strongestPitch: PitchInfo | null = null;
  const minMagnitude = 30; // Minimum volume threshold for detection
  
  // Find the strongest frequency peak
  for (let i = 0; i < frequencyData.length; i++) {
    const magnitude = frequencyData[i];
    
    // Check if this frequency is loud enough and is a local peak
    if (
      magnitude > minMagnitude &&
      (i === 0 || magnitude > frequencyData[i - 1]) &&
      (i === frequencyData.length - 1 || magnitude > frequencyData[i + 1])
    ) {
      // Calculate the actual frequency
      const frequency = (i * sampleRate) / fftSize;
      
      // Only consider frequencies in vocal range (65Hz to 1000Hz)
      if (frequency >= 65 && frequency <= 1000) {
        // Find which note this frequency corresponds to
        for (const [noteName, [minFreq, maxFreq]] of Object.entries(NOTE_FREQUENCIES)) {
          if (frequency >= minFreq && frequency <= maxFreq) {
            // Calculate the "perfect" frequency for this note
            const perfectFreq = (minFreq + maxFreq) / 2;
            
            // Calculate cents deviation
            const cents = calculateCents(frequency, perfectFreq);
            
            // Extract octave number
            const octave = parseInt(noteName.slice(-1));
            
            // If this is the strongest note so far, or we don't have one yet
            if (!strongestPitch || magnitude > strongestPitch.magnitude) {
              strongestPitch = {
                note: noteName,
                frequency,
                magnitude,
                octave,
                cents
              };
            }
            break;
          }
        }
      }
    }
  }
  
  return strongestPitch;
}
