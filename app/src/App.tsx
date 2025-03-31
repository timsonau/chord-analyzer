import { useState } from "react";
import { AudioRecorder } from "@/components/audio-recorder";
import { VocalPitchDisplay } from "@/components/vocal-pitch-display";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PitchInfo } from "@/lib/pitch-detection";

function App() {
  const [currentPitch, setCurrentPitch] = useState<PitchInfo | null>(null);
  const [volume, setVolume] = useState(0);

  return (
    <main className="container mx-auto py-10 px-4">
      <h1 className="text-4xl font-bold text-center mb-8">Vocal Pitch Detector</h1>

      <Tabs defaultValue="recorder" className="w-full max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recorder">Audio Recorder</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        <TabsContent value="recorder" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Record Audio</CardTitle>
              <CardDescription>
                Sing into your microphone to detect pitch
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AudioRecorder
                onPitchDetected={setCurrentPitch}
                onVolumeChange={setVolume}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pitch Detection</CardTitle>
              <CardDescription>
                Real-time analysis of your vocal pitch
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VocalPitchDisplay pitch={currentPitch} volume={volume} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle>About Vocal Pitch Detector</CardTitle>
              <CardDescription>How our pitch detection works</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Our pitch detection system uses frequency analysis to identify the exact pitch of your voice in real-time.
              </p>
              <p>
                The system works by:
              </p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Recording audio from your voice</li>
                <li>Analyzing the audio spectrum to detect frequency peaks</li>
                <li>Converting frequencies to musical notes</li>
                <li>Measuring pitch accuracy in cents (±50 cents = ±half semitone)</li>
                <li>Providing real-time visual feedback</li>
              </ol>
              <p className="text-sm text-muted-foreground mt-4">
                This technology helps you improve your vocal pitch accuracy and train your ear.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}

export default App;
