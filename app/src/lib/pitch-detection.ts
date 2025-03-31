// Frequency ranges for each note (in Hz) - with wider ranges for better detection
const NOTE_FREQUENCIES: Record<string, [number, number]> = {
  C: [261.63 - 15, 261.63 + 15],
  "C#": [277.18 - 15, 277.18 + 15],
  D: [293.66 - 15, 293.66 + 15],
  "D#": [311.13 - 15, 311.13 + 15],
  E: [329.63 - 15, 329.63 + 15],
  F: [349.23 - 15, 349.23 + 15],
  "F#": [369.99 - 15, 369.99 + 15],
  G: [392.0 - 15, 392.0 + 15],
  "G#": [415.3 - 15, 415.3 + 15],
  A: [440.0 - 15, 440.0 + 15],
  "A#": [466.16 - 15, 466.16 + 15],
  B: [493.88 - 15, 493.88 + 15],
  // Add octaves
  C2: [523.25 - 15, 523.25 + 15],
  "C#2": [554.37 - 15, 554.37 + 15],
  D2: [587.33 - 15, 587.33 + 15],
  "D#2": [622.25 - 15, 622.25 + 15],
  E2: [659.26 - 15, 659.26 + 15],
  F2: [698.46 - 15, 698.46 + 15],
  "F#2": [739.99 - 15, 739.99 + 15],
  G2: [783.99 - 15, 783.99 + 15],
  "G#2": [830.61 - 15, 830.61 + 15],
  A2: [880.0 - 15, 880.0 + 15],
  "A#2": [932.33 - 15, 932.33 + 15],
  B2: [987.77 - 15, 987.77 + 15],
  // Lower octave
  "C-1": [130.81 - 8, 130.81 + 8],
  "C#-1": [138.59 - 8, 138.59 + 8],
  "D-1": [146.83 - 8, 146.83 + 8],
  "D#-1": [155.56 - 8, 155.56 + 8],
  "E-1": [164.81 - 8, 164.81 + 8],
  "F-1": [174.61 - 8, 174.61 + 8],
  "F#-1": [185.0 - 8, 185.0 + 8],
  "G-1": [196.0 - 8, 196.0 + 8],
  "G#-1": [207.65 - 8, 207.65 + 8],
  "A-1": [220.0 - 8, 220.0 + 8],
  "A#-1": [233.08 - 8, 233.08 + 8],
  "B-1": [246.94 - 8, 246.94 + 8],
};

// Detect pitches from frequency data
export function detectPitches(
  frequencyData: Uint8Array,
  fftSize: number,
  sampleRate: number,
): string[] {
  const detectedNotes: string[] = [];
  const noteThreshold = 100; // Lower threshold for more sensitivity

  // Find peaks in the frequency spectrum
  const peaks: { frequency: number; magnitude: number }[] = [];

  for (let i = 0; i < frequencyData.length; i++) {
    const magnitude = frequencyData[i];

    // Check if this is a peak (higher than neighbors)
    if (
      magnitude > noteThreshold &&
      (i === 0 || magnitude > frequencyData[i - 1]) &&
      (i === frequencyData.length - 1 || magnitude > frequencyData[i + 1])
    ) {
      // Calculate the actual frequency
      const frequency = (i * sampleRate) / fftSize;

      // Only consider frequencies in our musical range (80Hz to 1100Hz)
      if (frequency > 80 && frequency < 1100) {
        peaks.push({ frequency, magnitude });
      }
    }
  }

  // Sort peaks by magnitude (strongest first)
  peaks.sort((a, b) => b.magnitude - a.magnitude);

  // Take the top 12 peaks (or fewer if there aren't that many)
  const topPeaks = peaks.slice(0, 12);

  // Map frequencies to notes
  for (const peak of topPeaks) {
    for (const [note, [minFreq, maxFreq]] of Object.entries(NOTE_FREQUENCIES)) {
      if (peak.frequency >= minFreq && peak.frequency <= maxFreq) {
        // Extract the base note without octave
        const baseNote = note.replace(/[-\d]/g, "");

        // Only add if not already in the list
        if (!detectedNotes.includes(baseNote)) {
          detectedNotes.push(baseNote);
        }
        break;
      }
    }
  }

  return detectedNotes;
}
