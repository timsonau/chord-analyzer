import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { chordDatabase } from "@/lib/chord-database"

interface ChordDetectorProps {
  activeNotes: string[]
  rootNote: string | null
}

interface ChordMatch {
  name: string
  fullName: string
  matchPercentage: number
  notes: string[]
}

export function ChordDetector({ activeNotes, rootNote }: ChordDetectorProps) {
  const [matches, setMatches] = useState<ChordMatch[]>([])
  
  useEffect(() => {
    if (activeNotes.length === 0) {
      setMatches([])
      return
    }
    
    const detectedMatches = detectChords(activeNotes, rootNote)
    setMatches(detectedMatches)
  }, [activeNotes, rootNote])
  
  if (activeNotes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Record audio to detect chords
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-sm font-medium">Detected Notes:</span>
        {activeNotes.map(note => (
          <Badge key={note} variant={rootNote === note ? "default" : "outline"}>
            {note}
            {rootNote === note && " (root)"}
          </Badge>
        ))}
      </div>
      
      {matches.length > 0 ? (
        <div className="space-y-3">
          {matches.slice(0, 5).map((match, index) => (
            <div key={match.name} className="space-y-1">
              <div className="flex justify-between items-center">
                <div className="font-medium">
                  {index === 0 ? (
                    <span className="text-lg">{match.fullName}</span>
                  ) : (
                    <span>{match.fullName}</span>
                  )}
                </div>
                <span className="text-sm">{Math.round(match.matchPercentage)}%</span>
              </div>
              <Progress value={match.matchPercentage} className="h-2" />
              <div className="text-xs text-muted-foreground flex flex-wrap gap-1 mt-1">
                {match.notes.map(note => (
                  <span key={note} className={`${activeNotes.includes(note) ? "text-primary" : "text-muted-foreground"}`}>
                    {note}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-muted-foreground">
          No matching chords found
        </div>
      )}
    </div>
  )
}

function detectChords(activeNotes: string[], rootNote: string | null): ChordMatch[] {
  const matches: ChordMatch[] = []
  
  // If we have a root note, prioritize chords with that root
  const possibleRoots = rootNote ? [rootNote] : getAllNotes()
  
  for (const root of possibleRoots) {
    for (const [chordType, chordInfo] of Object.entries(chordDatabase)) {
      const chordNotes = generateChordNotes(root, chordInfo.intervals)
      
      // Calculate match percentage with weighted 3rd and 7th
      let matchScore = 0
      let totalPossibleScore = 0
      
      chordNotes.forEach((note, index) => {
        // Determine if this note is a 3rd or 7th based on interval position
        const isThird = chordInfo.intervals[index] === 4 || chordInfo.intervals[index] === 3
        const isSeventh = chordInfo.intervals[index] === 10 || chordInfo.intervals[index] === 11
        
        // Weight factors
        const weight = isThird || isSeventh ? 2 : 1
        totalPossibleScore += weight
        
        if (activeNotes.includes(note)) {
          matchScore += weight
        }
      })
      
      // Add points for each active note that's in the chord
      activeNotes.forEach(note => {
        if (chordNotes.includes(note)) {
          matchScore += 0.5
        }
      })
      
      // Penalize for notes that aren't in the chord
      activeNotes.forEach(note => {
        if (!chordNotes.includes(note)) {
          matchScore -= 0.5
        }
      })
      
      const matchPercentage = (matchScore / totalPossibleScore) * 100
      
      // Only include reasonable matches
      if (matchPercentage > 30) {
        matches.push({
          name: chordType,
          fullName: `${root}${chordInfo.suffix}`,
          matchPercentage: Math.min(matchPercentage, 100), // Cap at 100%
          notes: chordNotes
        })
      }
    }
  }
  
  // Sort by match percentage
  return matches.sort((a, b) => b.matchPercentage - a.matchPercentage)
}

function generateChordNotes(root: string, intervals: number[]): string[] {
  const allNotes = getAllNotes()
  const rootIndex = allNotes.indexOf(root)
  
  return intervals.map(interval => {
    const noteIndex = (rootIndex + interval) % 12
    return allNotes[noteIndex]
  })
}

function getAllNotes(): string[] {
  return ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
}