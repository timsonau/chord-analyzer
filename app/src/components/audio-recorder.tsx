import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Mic, Square, BarChart2, Info } from 'lucide-react'
import { detectPitches } from "@/lib/pitch-detection"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AudioRecorderProps {
  setActiveNotes: (notes: string[]) => void
  setRootNote: (note: string | null) => void
}

export function AudioRecorder({ setActiveNotes, setRootNote }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [volume, setVolume] = useState(0)
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({})
  const [showDebug, setShowDebug] = useState(false)
  
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserNodeRef = useRef<AnalyserNode | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null)
  const lastUpdateTimeRef = useRef<number>(0)
  const detectedNotesRef = useRef<string[]>([])
  
  // Debug function
  const updateDebugInfo = useCallback((info: Record<string, any>) => {
    setDebugInfo(prev => ({ ...prev, ...info }))
  }, [])
  
  // Initialize audio context on user interaction only
  const initAudioContext = useCallback(async () => {
    try {
      if (!audioContextRef.current) {
        console.log("Creating new AudioContext")
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        if (!AudioContextClass) {
          throw new Error("AudioContext not supported in this browser")
        }
        
        const context = new AudioContextClass()
        audioContextRef.current = context
        
        // Create analyzer with smaller FFT size for better performance
        const analyser = context.createAnalyser()
        analyser.fftSize = 2048
        analyser.smoothingTimeConstant = 0.8
        analyserNodeRef.current = analyser
        
        // Also create a ScriptProcessor as fallback
        const processor = context.createScriptProcessor(4096, 1, 1)
        processorNodeRef.current = processor
        
        updateDebugInfo({ 
          audioContextCreated: true,
          audioContextState: context.state,
          sampleRate: context.sampleRate,
          analyzerCreated: true,
          fftSize: analyser.fftSize
        })
      }
      
      // Make sure context is running
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume()
        updateDebugInfo({ audioContextState: audioContextRef.current.state })
      }
      
      return true
    } catch (err) {
      console.error("Audio context initialization error:", err)
      setError(`Could not initialize audio context: ${err instanceof Error ? err.message : 'Unknown error'}`)
      updateDebugInfo({ audioContextError: err instanceof Error ? err.message : String(err) })
      return false
    }
  }, [updateDebugInfo])
  
  // Clean up function
  const cleanupAudio = useCallback(() => {
    // Stop all tracks in the media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        track.stop()
        updateDebugInfo({ trackStopped: true })
      })
      mediaStreamRef.current = null
    }
    
    // Disconnect source node if it exists
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.disconnect()
        updateDebugInfo({ sourceDisconnected: true })
      } catch (e) {
        console.log("Error disconnecting source:", e)
      }
      sourceNodeRef.current = null
    }
    
    // Disconnect processor node if it exists
    if (processorNodeRef.current) {
      try {
        processorNodeRef.current.disconnect()
        updateDebugInfo({ processorDisconnected: true })
      } catch (e) {
        console.log("Error disconnecting processor:", e)
      }
      processorNodeRef.current.onaudioprocess = null
    }
    
    // Cancel animation frame if it exists
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
      updateDebugInfo({ animationCancelled: true })
    }
    
    setIsRecording(false)
  }, [updateDebugInfo])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAudio()
      
      // Close audio context
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error)
        audioContextRef.current = null
      }
    }
  }, [cleanupAudio])
  
  // Analyze audio function - separated from the animation loop
  const analyzeAudio = useCallback((dataArray: Uint8Array, bufferLength: number) => {
    // Calculate volume level
    let sum = 0
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i]
    }
    const avg = sum / bufferLength
    setVolume(avg / 256) // Normalize to 0-1
    
    updateDebugInfo({ 
      volumeLevel: avg,
      bufferLength,
      timestamp: Date.now()
    })
    
    // Only detect notes when there's significant audio and not too frequently
    const now = Date.now()
    if (avg > 20 && now - lastUpdateTimeRef.current > 200) { // Throttle to once every 200ms
      try {
        const detectedNotes = detectPitches(
          dataArray, 
          analyserNodeRef.current?.fftSize || 2048, 
          audioContextRef.current?.sampleRate || 44100
        )
        
        updateDebugInfo({ 
          detectedNotes,
          noteDetectionTime: now,
          significantAudio: true
        })
        
        // Only update if notes have changed
        if (JSON.stringify(detectedNotes) !== JSON.stringify(detectedNotesRef.current)) {
          detectedNotesRef.current = detectedNotes
          setActiveNotes(detectedNotes)
          
          // Set the root note to the lowest note if we have notes
          if (detectedNotes.length > 0) {
            // Find the lowest note by comparing their positions in the chromatic scale
            const allNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
            let lowestNote = detectedNotes[0]
            let lowestIndex = allNotes.indexOf(lowestNote)
            
            for (let i = 1; i < detectedNotes.length; i++) {
              const noteIndex = allNotes.indexOf(detectedNotes[i])
              if (noteIndex < lowestIndex) {
                lowestIndex = noteIndex
                lowestNote = detectedNotes[i]
              }
            }
            
            setRootNote(lowestNote)
          } else {
            setRootNote(null)
          }
          
          lastUpdateTimeRef.current = now
        }
      } catch (err) {
        console.error("Error in note detection:", err)
        updateDebugInfo({ noteDetectionError: err instanceof Error ? err.message : String(err) })
      }
    }
  }, [setActiveNotes, setRootNote, updateDebugInfo])
  
  // Animation loop for visualization
  const startVisualization = useCallback(() => {
    if (!analyserNodeRef.current || !canvasRef.current) {
      updateDebugInfo({ visualizationError: "Missing analyzer or canvas" })
      return
    }
    
    const analyser = analyserNodeRef.current
    const canvas = canvasRef.current
    const canvasCtx = canvas.getContext('2d')
    if (!canvasCtx) {
      updateDebugInfo({ visualizationError: "Could not get canvas context" })
      return
    }
    
    updateDebugInfo({ visualizationStarted: true })
    
    const width = canvas.width
    const height = canvas.height
    
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    
    const draw = () => {
      animationRef.current = requestAnimationFrame(draw)
      
      try {
        // Get frequency data
        analyser.getByteFrequencyData(dataArray)
        
        // Analyze audio data (throttled inside)
        analyzeAudio(dataArray, bufferLength)
        
        // Draw frequency spectrum
        canvasCtx.fillStyle = 'rgb(20, 20, 20)'
        canvasCtx.fillRect(0, 0, width, height)
        
        const barWidth = (width / bufferLength) * 2.5
        let barHeight
        let x = 0
        
        for (let i = 0; i < bufferLength; i++) {
          barHeight = dataArray[i] / 2
          
          canvasCtx.fillStyle = `hsl(${barHeight + 180}, 100%, 50%)`
          canvasCtx.fillRect(x, height - barHeight, barWidth, barHeight)
          
          x += barWidth + 1
        }
      } catch (err) {
        console.error("Error in visualization loop:", err)
        updateDebugInfo({ visualizationError: err instanceof Error ? err.message : String(err) })
        
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
          animationRef.current = null
        }
      }
    }
    
    draw()
  }, [analyzeAudio, updateDebugInfo])
  
  // Alternative audio processing using ScriptProcessor
  const setupScriptProcessor = useCallback(() => {
    if (!audioContextRef.current || !processorNodeRef.current || !analyserNodeRef.current) {
      return false
    }
    
    try {
      // Connect processor to destination to make it work
      processorNodeRef.current.connect(audioContextRef.current.destination)
      
      // Set up audio processing callback
      processorNodeRef.current.onaudioprocess = () => {
        if (!analyserNodeRef.current) return
        
        const bufferLength = analyserNodeRef.current.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        
        // Get frequency data
        analyserNodeRef.current.getByteFrequencyData(dataArray)
        
        // Process the data
        analyzeAudio(dataArray, bufferLength)
      }
      
      updateDebugInfo({ scriptProcessorSetup: true })
      return true
    } catch (err) {
      console.error("Error setting up script processor:", err)
      updateDebugInfo({ scriptProcessorError: err instanceof Error ? err.message : String(err) })
      return false
    }
  }, [analyzeAudio, updateDebugInfo])
  
  // Start recording
  const startRecording = async () => {
    try {
      setError(null)
      
      // Initialize audio context
      const initialized = await initAudioContext()
      if (!initialized || !audioContextRef.current || !analyserNodeRef.current) {
        throw new Error("Failed to initialize audio context")
      }
      
      // Get microphone access
      console.log("Requesting microphone access...")
      const constraints = { 
        audio: { 
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        } 
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      mediaStreamRef.current = stream
      
      updateDebugInfo({ 
        microphoneAccess: true,
        trackCount: stream.getAudioTracks().length,
        trackSettings: stream.getAudioTracks()[0]?.getSettings()
      })
      
      // Connect the microphone to the analyser
      const source = audioContextRef.current.createMediaStreamSource(stream)
      sourceNodeRef.current = source
      
      // Connect source to analyzer
      source.connect(analyserNodeRef.current)
      
      // Also connect to script processor as a fallback
      if (processorNodeRef.current) {
        source.connect(processorNodeRef.current)
        setupScriptProcessor()
      }
      
      setIsRecording(true)
      
      // Start analyzing audio
      startVisualization()
      
      updateDebugInfo({ recordingStarted: true })
    } catch (err) {
      console.error("Recording error:", err)
      setError(`Microphone access error: ${err instanceof Error ? err.message : 'Unknown error'}. Please check browser permissions.`)
      updateDebugInfo({ recordingError: err instanceof Error ? err.message : String(err) })
      cleanupAudio()
    }
  }
  
  // Stop recording
  const stopRecording = () => {
    cleanupAudio()
    setActiveNotes([])
    setRootNote(null)
  }
  
  // Check browser capabilities on mount
  useEffect(() => {
    const checkCapabilities = async () => {
      const audioContextSupported = typeof AudioContext !== 'undefined' || 
                                   typeof (window as any).webkitAudioContext !== 'undefined'
      
      const userMediaSupported = navigator.mediaDevices && 
                                typeof navigator.mediaDevices.getUserMedia !== 'undefined'
      
      const secureContext = window.isSecureContext
      
      let permissionState = 'unknown'
      
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
          permissionState = result.state
        } catch (e) {
          permissionState = 'error checking'
        }
      }
      
      updateDebugInfo({
        browserCapabilities: {
          audioContextSupported,
          userMediaSupported,
          secureContext,
          permissionState,
          userAgent: navigator.userAgent
        }
      })
    }
    
    checkCapabilities()
  }, [updateDebugInfo])
  
  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex justify-between items-center">
        <Button 
          onClick={isRecording ? stopRecording : startRecording}
          variant={isRecording ? "destructive" : "default"}
          className="gap-2"
        >
          {isRecording ? (
            <>
              <Square className="h-4 w-4" />
              Stop Recording
            </>
          ) : (
            <>
              <Mic className="h-4 w-4" />
              Start Recording
            </>
          )}
        </Button>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowDebug(!showDebug)}
            title="Toggle debug info"
          >
            <Info className="h-4 w-4" />
          </Button>
          
          <BarChart2 className="h-4 w-4" />
          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-100"
              style={{ width: `${volume * 100}%` }}
            />
          </div>
        </div>
      </div>
      
      <div className="border rounded-md overflow-hidden bg-black">
        <canvas 
          ref={canvasRef} 
          width={600} 
          height={200} 
          className="w-full h-[200px]"
        />
      </div>
      
      <div className="text-xs text-muted-foreground">
        Play your instrument or chord into the microphone. The analyzer will detect the notes and identify the chord.
      </div>
      
      {showDebug && (
        <div className="mt-4 p-3 bg-muted/20 rounded-md text-xs font-mono overflow-auto max-h-[200px]">
          <h4 className="font-bold mb-2">Debug Info:</h4>
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}