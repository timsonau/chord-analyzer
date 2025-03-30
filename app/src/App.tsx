import { useState } from "react"
import { AudioRecorder } from "@/components/audio-recorder"
import { ChordDetector } from "@/components/chord-detector"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

function App() {
  const [activeNotes, setActiveNotes] = useState<string[]>([])
  const [rootNote, setRootNote] = useState<string | null>(null)

  return (
    <main className="container mx-auto py-10 px-4">
      <h1 className="text-4xl font-bold text-center mb-8">Chord Analyzer</h1>
      
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
                Record audio from your instrument to detect chords
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AudioRecorder 
                setActiveNotes={setActiveNotes} 
                setRootNote={setRootNote}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Chord Detection</CardTitle>
              <CardDescription>
                The most likely chord based on the notes detected
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChordDetector activeNotes={activeNotes} rootNote={rootNote} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle>About Chord Analyzer</CardTitle>
              <CardDescription>How our chord detection works</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Our chord detection system uses an advanced pattern matching algorithm to identify chords from audio recordings.
              </p>
              <p>
                The system works by:
              </p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Recording audio from your instrument or voice</li>
                <li>Analyzing the audio spectrum to detect individual notes</li>
                <li>Mapping detected notes to our comprehensive chord database</li>
                <li>Analyzing the harmonic structure with special emphasis on the 3rd and 7th notes that define chord quality</li>
                <li>Calculating match percentages for possible chord interpretations</li>
                <li>Presenting the most likely chord options ranked by probability</li>
              </ol>
              <p className="text-sm text-muted-foreground mt-4">
                This technology provides accurate chord identification for music composition, education, and analysis.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}

export default App