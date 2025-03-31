import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Info } from "lucide-react";
import { detectPitch, PitchInfo } from "@/lib/pitch-detection";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Audio analysis configuration
const AUDIO_CONFIG = {
  MIN_VOLUME_THRESHOLD: 10, // Reduced from 20 for better sensitivity
  HISTORY_SIZE: 5,
  PITCH_DECAY_TIME: 800,
  FFT_SIZE: 2048,
  SMOOTHING_CONSTANT: 0.8,
  PROCESSOR_BUFFER_SIZE: 4096
} as const

interface AudioRecorderProps {
  onPitchDetected: (pitch: PitchInfo | null) => void;
  onVolumeChange: (volume: number) => void;
}

export function AudioRecorder({ onPitchDetected, onVolumeChange }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});
  const [showDebug, setShowDebug] = useState(false);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  // Refs for pitch smoothing
  const lastPitchRef = useRef<PitchInfo | null>(null);
  const pitchHistoryRef = useRef<PitchInfo[]>([]);
  const silenceStartRef = useRef<number | null>(null);

  // Debug function
  const updateDebugInfo = useCallback((info: Record<string, any>) => {
    setDebugInfo((prev) => ({ ...prev, ...info }));
  }, []);

  // Initialize audio context on user interaction only
  const initAudioContext = useCallback(async () => {
    try {
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        if (!AudioContextClass) throw new Error("AudioContext not supported")

        const context = new AudioContextClass()
        audioContextRef.current = context

        const analyser = context.createAnalyser()
        analyser.fftSize = AUDIO_CONFIG.FFT_SIZE
        analyser.smoothingTimeConstant = AUDIO_CONFIG.SMOOTHING_CONSTANT
        analyserNodeRef.current = analyser

        const processor = context.createScriptProcessor(AUDIO_CONFIG.PROCESSOR_BUFFER_SIZE, 1, 1)
        processorNodeRef.current = processor

        updateDebugInfo({
          audioContextCreated: true,
          audioContextState: context.state,
          sampleRate: context.sampleRate,
          analyzerCreated: true,
          fftSize: analyser.fftSize
        })
      }

      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume()
        updateDebugInfo({ audioContextState: audioContextRef.current.state })
      }

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      console.error("Audio context initialization error:", err)
      setError(`Could not initialize audio context: ${errorMessage}`)
      updateDebugInfo({ audioContextError: errorMessage })
      return false
    }
  }, [updateDebugInfo])

  // Clean up function
  const cleanupAudio = useCallback(() => {
    // Stop all tracks in the media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        track.stop();
        updateDebugInfo({ trackStopped: true });
      });
      mediaStreamRef.current = null;
    }

    // Disconnect source node if it exists
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.disconnect();
        updateDebugInfo({ sourceDisconnected: true });
      } catch (e) {
        console.log("Error disconnecting source:", e);
      }
      sourceNodeRef.current = null;
    }

    // Disconnect processor node if it exists
    if (processorNodeRef.current) {
      try {
        processorNodeRef.current.disconnect();
        updateDebugInfo({ processorDisconnected: true });
      } catch (e) {
        console.log("Error disconnecting processor:", e);
      }
      processorNodeRef.current.onaudioprocess = null;
    }

    // Cancel animation frame if it exists
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
      updateDebugInfo({ animationCancelled: true });
    }

    pitchHistoryRef.current = [];
    lastPitchRef.current = null;
    silenceStartRef.current = null;

    setIsRecording(false);
    onPitchDetected(null);
    onVolumeChange(0);
  }, [updateDebugInfo, onPitchDetected, onVolumeChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAudio();

      // Close audio context
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
      }
    };
  }, [cleanupAudio]);

  // Analyze audio function - separated from the animation loop
  const analyzeAudio = useCallback((dataArray: Uint8Array, bufferLength: number) => {
    const calculateVolume = (data: Uint8Array, length: number) => {
      const sum = data.reduce((acc, val) => acc + val, 0)
      return sum / length
    }

    const volume = calculateVolume(dataArray, bufferLength)
    const normalizedVolume = Math.pow(volume / 256, 0.7) // Apply gamma correction for better sensitivity
    onVolumeChange(normalizedVolume)

    updateDebugInfo({
      volumeLevel: volume,
      normalizedVolume,
      bufferLength,
      timestamp: Date.now()
    })

    const now = Date.now()

    // Detect pitch with increased sensitivity
    if (volume > AUDIO_CONFIG.MIN_VOLUME_THRESHOLD) {
      silenceStartRef.current = null

      try {
        const detectedPitch = detectPitch(
          dataArray,
          analyserNodeRef.current?.fftSize || AUDIO_CONFIG.FFT_SIZE,
          audioContextRef.current?.sampleRate || 44100
        )

        if (detectedPitch) {
          pitchHistoryRef.current = [
            ...pitchHistoryRef.current.slice(-(AUDIO_CONFIG.HISTORY_SIZE - 1)),
            detectedPitch
          ]

          const shouldUpdatePitch = pitchHistoryRef.current.length >= 3 ||
            !lastPitchRef.current ||
            lastPitchRef.current.note !== detectedPitch.note

          if (shouldUpdatePitch) {
            const avgPitch = calculateAveragePitch(pitchHistoryRef.current)
            lastPitchRef.current = avgPitch
            onPitchDetected(avgPitch)
          }
        }

        updateDebugInfo({
          pitch: detectedPitch,
          pitchHistory: pitchHistoryRef.current.length,
          pitchDetectionTime: now,
          significantAudio: true
        })

        lastUpdateTimeRef.current = now
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        console.error("Error in pitch detection:", err)
        updateDebugInfo({ pitchDetectionError: errorMessage })
      }
    } else {
      handleSilence(now)
    }
  }, [onPitchDetected, onVolumeChange, updateDebugInfo])

  const calculateAveragePitch = (pitches: PitchInfo[]): PitchInfo => {
    const avgFrequency = pitches.reduce((sum, p) => sum + p.frequency, 0) / pitches.length
    const avgMagnitude = pitches.reduce((sum, p) => sum + p.magnitude, 0) / pitches.length
    const lastPitch = pitches[pitches.length - 1]

    const perfectFreq = lastPitch.frequency * Math.pow(2, -lastPitch.cents/1200)
    const cents = Math.round(1200 * Math.log2(avgFrequency / perfectFreq))

    return {
      ...lastPitch,
      frequency: avgFrequency,
      magnitude: avgMagnitude,
      cents
    }
  }

  const handleSilence = (now: number) => {
    if (!silenceStartRef.current) {
      silenceStartRef.current = now
    } else if (now - silenceStartRef.current > AUDIO_CONFIG.PITCH_DECAY_TIME) {
      pitchHistoryRef.current = []
      lastPitchRef.current = null
      onPitchDetected(null)
    }
  }

  // Animation loop for visualization
  const startVisualization = useCallback(() => {
    if (!analyserNodeRef.current || !canvasRef.current) {
      updateDebugInfo({ visualizationError: "Missing analyzer or canvas" });
      return;
    }

    const analyser = analyserNodeRef.current;
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext("2d");
    if (!canvasCtx) {
      updateDebugInfo({ visualizationError: "Could not get canvas context" });
      return;
    }

    updateDebugInfo({ visualizationStarted: true });

    const width = canvas.width;
    const height = canvas.height;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      try {
        // Get frequency data
        analyser.getByteFrequencyData(dataArray);

        // Analyze audio data
        analyzeAudio(dataArray, bufferLength);

        // Draw frequency spectrum
        canvasCtx.fillStyle = "rgb(20, 20, 20)";
        canvasCtx.fillRect(0, 0, width, height);

        const barWidth = (width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          barHeight = dataArray[i] / 2;

          canvasCtx.fillStyle = `hsl(${barHeight + 180}, 100%, 50%)`;
          canvasCtx.fillRect(x, height - barHeight, barWidth, barHeight);

          x += barWidth + 1;
        }
      } catch (err) {
        console.error("Error in visualization loop:", err);
        updateDebugInfo({
          visualizationError: err instanceof Error ? err.message : String(err),
        });

        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
      }
    };

    draw();
  }, [analyzeAudio, updateDebugInfo]);

  // Alternative audio processing using ScriptProcessor
  const setupScriptProcessor = useCallback(() => {
    if (
      !audioContextRef.current ||
      !processorNodeRef.current ||
      !analyserNodeRef.current
    ) {
      return false;
    }

    try {
      // Connect processor to destination to make it work
      processorNodeRef.current.connect(audioContextRef.current.destination);

      // Set up audio processing callback
      processorNodeRef.current.onaudioprocess = () => {
        if (!analyserNodeRef.current) return;

        const bufferLength = analyserNodeRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        // Get frequency data
        analyserNodeRef.current.getByteFrequencyData(dataArray);

        // Process the data
        analyzeAudio(dataArray, bufferLength);
      };

      updateDebugInfo({ scriptProcessorSetup: true });
      return true;
    } catch (err) {
      console.error("Error setting up script processor:", err);
      updateDebugInfo({
        scriptProcessorError: err instanceof Error ? err.message : String(err),
      });
      return false;
    }
  }, [analyzeAudio, updateDebugInfo]);

  // Start recording
  const startRecording = async () => {
    try {
      setError(null);

      // Initialize audio context
      const initialized = await initAudioContext();
      if (
        !initialized ||
        !audioContextRef.current ||
        !analyserNodeRef.current
      ) {
        throw new Error("Failed to initialize audio context");
      }

      // Get microphone access
      console.log("Requesting microphone access...");
      const constraints = {
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;

      updateDebugInfo({
        microphoneAccess: true,
        trackCount: stream.getAudioTracks().length,
        trackSettings: stream.getAudioTracks()[0]?.getSettings(),
      });

      // Connect the microphone to the analyser
      const source = audioContextRef.current.createMediaStreamSource(stream);
      sourceNodeRef.current = source;

      // Connect source to analyzer
      source.connect(analyserNodeRef.current);

      // Also connect to script processor as a fallback
      if (processorNodeRef.current) {
        source.connect(processorNodeRef.current);
        setupScriptProcessor();
      }

      setIsRecording(true);

      // Start analyzing audio
      startVisualization();

      updateDebugInfo({ recordingStarted: true });
    } catch (err) {
      console.error("Recording error:", err);
      setError(
        `Microphone access error: ${err instanceof Error ? err.message : "Unknown error"}. Please check browser permissions.`,
      );
      updateDebugInfo({
        recordingError: err instanceof Error ? err.message : String(err),
      });
      cleanupAudio();
    }
  };

  // Stop recording
  const stopRecording = () => {
    cleanupAudio();
  };

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
          className="gap-2 min-w-[160px] transition-all duration-300 hover:shadow-lg"
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

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDebug(!showDebug)}
          title="Toggle debug info"
          className="opacity-50 hover:opacity-100 transition-opacity"
        >
          <Info className="h-4 w-4" />
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden bg-black/90 shadow-xl">
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          className="w-full h-[200px]"
        />
      </div>

      {showDebug && (
        <div className="mt-4 p-4 bg-muted/10 rounded-lg text-xs font-mono overflow-auto max-h-[200px] border border-border/50">
          <h4 className="font-medium mb-2 text-primary">Debug Info:</h4>
          <pre className="opacity-80">{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
