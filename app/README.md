# Live Chord Detection App

A real-time chord detection application that analyzes audio input to identify musical chords, built with React, TypeScript, and the Web Audio API.

## Features

- Real-time audio visualization with frequency spectrum analysis
- Advanced chord detection with support for:
  - Major, minor, diminished, and augmented triads
  - Seventh chords (major 7, minor 7, dominant 7)
  - Extended chords (9ths, 11ths, 13ths)
  - Chord inversions
  - Sus2 and Sus4 chords
- Musical context awareness using common chord progressions
- High-precision note detection with noise and harmonic filtering
- Beautiful, responsive UI built with Shadcn UI and Tailwind CSS

## Technical Details

### Audio Analysis
- Uses Web Audio API's AnalyserNode for frequency analysis
- Implements FFT (Fast Fourier Transform) for frequency detection
- Filters out harmonics and noise for accurate note detection
- Separate analyzers for visualization and note detection

### Chord Detection Algorithm
- Identifies chord roots based on bass notes and strong beats
- Matches note patterns against known chord voicings
- Considers musical context and previous chord progressions
- Weights important chord tones (3rds and 7ths) more heavily

### UI Components
- Real-time frequency spectrum visualization
- Note detection display with octave information
- Chord matches with confidence percentages
- Inversion and extension detection

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open http://localhost:5173 in your browser
5. Grant microphone access when prompted

## Requirements

- Modern browser with Web Audio API support
- Microphone access
- Node.js 18+ for development

## Development

The project uses:
- Vite for development and building
- TypeScript for type safety
- Tailwind CSS for styling
- Shadcn UI for components
- ESLint for code quality

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

MIT License - feel free to use this code for your own projects! 