import { PitchInfo } from "@/lib/pitch-detection"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Music, Volume2, Mic } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

interface VocalPitchDisplayProps {
  pitch: PitchInfo | null
  volume: number
}

export function VocalPitchDisplay({ pitch, volume }: VocalPitchDisplayProps) {
  // State for smooth transitions
  const [displayPitch, setDisplayPitch] = useState<PitchInfo | null>(null)
  const [isStable, setIsStable] = useState(false)
  const [stableTimer, setStableTimer] = useState<number>(0)
  
  // Update display pitch with smooth transitions
  useEffect(() => {
    if (pitch) {
      setDisplayPitch(pitch)
      // Check if the new pitch is close to the current one
      if (displayPitch && 
          displayPitch.note === pitch.note && 
          Math.abs(displayPitch.cents - pitch.cents) < 15) {
        setStableTimer(prev => prev + 1)
        if (stableTimer > 5) { // About 250ms of stability
          setIsStable(true)
        }
      } else {
        setStableTimer(0)
        setIsStable(false)
      }
    } else {
      // Keep the last pitch displayed during the decay period
      const timer = setTimeout(() => {
        setDisplayPitch(null)
        setIsStable(false)
        setStableTimer(0)
      }, 800) // Match the decay time from AudioRecorder
      return () => clearTimeout(timer)
    }
  }, [pitch])

  if (!displayPitch) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
        <Mic className="h-12 w-12 mb-4 animate-pulse" />
        <p>Sing a note to begin...</p>
      </div>
    )
  }

  // Calculate color based on cents deviation
  const getCentsColor = (cents: number) => {
    const absCents = Math.abs(cents)
    if (absCents <= 5) return "text-green-500"
    if (absCents <= 15) return "text-yellow-500"
    return "text-red-500"
  }

  // Format frequency to 1 decimal place
  const formattedFreq = displayPitch.frequency.toFixed(1)
  
  // Get note without octave for display
  const baseNote = displayPitch.note.replace(/[0-9]/g, "")
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center p-8 rounded-lg bg-muted/50">
        {/* Main note display */}
        <Badge 
          variant="outline" 
          className={cn(
            "text-6xl py-8 px-12 mb-4 font-bold bg-background transition-all duration-300",
            isStable && "ring-2 ring-green-500/50"
          )}
        >
          <Music className={cn(
            "mr-3 h-8 w-8 transition-transform",
            isStable && "text-green-500"
          )} />
          {baseNote}
          <span className="text-3xl ml-2 opacity-50">{displayPitch.octave}</span>
        </Badge>
        
        {/* Stability indicator */}
        {isStable && (
          <div className="text-green-500 text-sm mb-4 animate-fade-in">
            Note is stable ✨
          </div>
        )}
        
        {/* Frequency and cents deviation */}
        <div className="flex gap-4 text-sm mb-6">
          <span className="opacity-70">{formattedFreq} Hz</span>
          <span className={cn(
            "font-medium transition-colors duration-300",
            getCentsColor(displayPitch.cents)
          )}>
            {displayPitch.cents > 0 ? "+" : ""}{displayPitch.cents} cents
          </span>
        </div>
        
        {/* Volume meter */}
        <div className="w-full max-w-xs space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Volume</span>
            <Volume2 className="h-4 w-4" />
          </div>
          <Progress 
            value={volume * 100} 
            className="h-2"
          />
        </div>
      </div>
      
      {/* Pitch accuracy indicator */}
      <div className="relative h-4 w-full bg-muted rounded-full overflow-hidden">
        <div 
          className="absolute top-0 bottom-0 w-1 bg-primary transition-all duration-300"
          style={{ 
            left: "50%",
            transform: `translateX(${displayPitch.cents * 2}%)` 
          }}
        />
        <div className="absolute top-0 bottom-0 w-[2px] left-1/2 -translate-x-1/2 bg-primary/30" />
      </div>
      
      {/* Tuning guide */}
      <div className="text-center text-sm text-muted-foreground">
        {Math.abs(displayPitch.cents) <= 5 ? (
          <span className="text-green-500">Perfect pitch! ✨</span>
        ) : displayPitch.cents > 5 ? (
          "Sing slightly lower ↓"
        ) : displayPitch.cents < -5 ? (
          "Sing slightly higher ↑"
        ) : null}
      </div>
    </div>
  )
} 