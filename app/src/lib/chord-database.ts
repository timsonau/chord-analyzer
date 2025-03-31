// Chord database with intervals from root note
// Intervals are in semitones: 0=root, 4=major third, 3=minor third, etc.

interface ChordInfo {
  suffix: string;
  intervals: number[];
  description?: string;
}

export const chordDatabase: Record<string, ChordInfo> = {
  // Triads
  major: {
    suffix: "",
    intervals: [0, 4, 7],
    description: "Major triad",
  },
  minor: {
    suffix: "m",
    intervals: [0, 3, 7],
    description: "Minor triad",
  },
  diminished: {
    suffix: "dim",
    intervals: [0, 3, 6],
    description: "Diminished triad",
  },
  augmented: {
    suffix: "aug",
    intervals: [0, 4, 8],
    description: "Augmented triad",
  },
  sus2: {
    suffix: "sus2",
    intervals: [0, 2, 7],
    description: "Suspended 2nd",
  },
  sus4: {
    suffix: "sus4",
    intervals: [0, 5, 7],
    description: "Suspended 4th",
  },

  // 7th chords
  major7: {
    suffix: "maj7",
    intervals: [0, 4, 7, 11],
    description: "Major 7th",
  },
  dominant7: {
    suffix: "7",
    intervals: [0, 4, 7, 10],
    description: "Dominant 7th",
  },
  minor7: {
    suffix: "m7",
    intervals: [0, 3, 7, 10],
    description: "Minor 7th",
  },
  "minor-major7": {
    suffix: "mMaj7",
    intervals: [0, 3, 7, 11],
    description: "Minor-Major 7th",
  },
  diminished7: {
    suffix: "dim7",
    intervals: [0, 3, 6, 9],
    description: "Diminished 7th",
  },
  "half-diminished7": {
    suffix: "m7b5",
    intervals: [0, 3, 6, 10],
    description: "Half-diminished 7th",
  },
  augmented7: {
    suffix: "aug7",
    intervals: [0, 4, 8, 10],
    description: "Augmented 7th",
  },
  "augmented-major7": {
    suffix: "augMaj7",
    intervals: [0, 4, 8, 11],
    description: "Augmented Major 7th",
  },

  // 6th chords
  major6: {
    suffix: "6",
    intervals: [0, 4, 7, 9],
    description: "Major 6th",
  },
  minor6: {
    suffix: "m6",
    intervals: [0, 3, 7, 9],
    description: "Minor 6th",
  },

  // 9th chords
  major9: {
    suffix: "maj9",
    intervals: [0, 4, 7, 11, 14],
    description: "Major 9th",
  },
  dominant9: {
    suffix: "9",
    intervals: [0, 4, 7, 10, 14],
    description: "Dominant 9th",
  },
  minor9: {
    suffix: "m9",
    intervals: [0, 3, 7, 10, 14],
    description: "Minor 9th",
  },

  // 11th chords
  major11: {
    suffix: "maj11",
    intervals: [0, 4, 7, 11, 14, 17],
    description: "Major 11th",
  },
  dominant11: {
    suffix: "11",
    intervals: [0, 4, 7, 10, 14, 17],
    description: "Dominant 11th",
  },
  minor11: {
    suffix: "m11",
    intervals: [0, 3, 7, 10, 14, 17],
    description: "Minor 11th",
  },

  // 13th chords
  major13: {
    suffix: "maj13",
    intervals: [0, 4, 7, 11, 14, 17, 21],
    description: "Major 13th",
  },
  dominant13: {
    suffix: "13",
    intervals: [0, 4, 7, 10, 14, 17, 21],
    description: "Dominant 13th",
  },
  minor13: {
    suffix: "m13",
    intervals: [0, 3, 7, 10, 14, 17, 21],
    description: "Minor 13th",
  },

  // Added tone chords
  add9: {
    suffix: "add9",
    intervals: [0, 4, 7, 14],
    description: "Added 9th",
  },
  madd9: {
    suffix: "madd9",
    intervals: [0, 3, 7, 14],
    description: "Minor Added 9th",
  },
  add11: {
    suffix: "add11",
    intervals: [0, 4, 7, 17],
    description: "Added 11th",
  },

  // Altered chords
  "7b5": {
    suffix: "7b5",
    intervals: [0, 4, 6, 10],
    description: "Dominant 7th flat 5",
  },
  "7#5": {
    suffix: "7#5",
    intervals: [0, 4, 8, 10],
    description: "Dominant 7th sharp 5",
  },
  "7b9": {
    suffix: "7b9",
    intervals: [0, 4, 7, 10, 13],
    description: "Dominant 7th flat 9",
  },
  "7#9": {
    suffix: "7#9",
    intervals: [0, 4, 7, 10, 15],
    description: "Dominant 7th sharp 9",
  },
  "7#11": {
    suffix: "7#11",
    intervals: [0, 4, 7, 10, 14, 18],
    description: "Dominant 7th sharp 11",
  },
  "7b13": {
    suffix: "7b13",
    intervals: [0, 4, 7, 10, 14, 17, 20],
    description: "Dominant 7th flat 13",
  },
};
