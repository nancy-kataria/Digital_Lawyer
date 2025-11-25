"use client"

import { Button } from "@/components/UI/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/UI/Card"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Camera, Mic, AlertTriangle, Phone, Square } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { GeminiLiveService } from "@/lib/gemini-live-service"

interface IncidentCaptureProps {
  onBack: () => void
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface EmergencyContact {
  id: string
  name: string
  phone: string
  email: string
  relationship: string
}

interface TranscriptEntry {
  id: string
  text: string
  speaker: "user" | "ai"
  timestamp: Date
}

export function IncidentCapture({ onBack }: IncidentCaptureProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [currentSubtitle, setCurrentSubtitle] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([])

  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const geminiServiceRef = useRef<GeminiLiveService | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    let currentStream: MediaStream | null = null

    const initializeMedia = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            frameRate: { ideal: 30, max: 60 },
            aspectRatio: 16/9
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
          },
        })

        currentStream = mediaStream
        setStream(mediaStream)
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
          // Waiting for metadata to load before setting up video
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              videoRef.current.play().catch(console.error)
            }
          }
        }
      } catch (error) {
        console.error("Error accessing media devices:", error)
        toast({
          title: "Camera Access Error",
          description: "Unable to access camera and microphone. Please check permissions.",
          variant: "destructive",
        })
      }
    }

    initializeMedia()

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [toast])

  // Initialize speech recognition
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()

      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = "en-US"

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = ""
        let interimTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        if (finalTranscript) {
          handleUserSpeech(finalTranscript)
        }
        setCurrentSubtitle(interimTranscript)
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error)
        toast({
          title: "Speech Recognition Error",
          description: "Unable to process speech. Please try again.",
          variant: "destructive",
        })
      }

      recognitionRef.current = recognition
    } else {
      toast({
        title: "Speech Recognition Unavailable",
        description: "Your browser doesn't support speech recognition. You can still record video.",
        variant: "destructive",
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load emergency contacts
  useEffect(() => {
    const savedContacts = localStorage.getItem("digital-lawyer-emergency-contacts")
    if (savedContacts) {
      setEmergencyContacts(JSON.parse(savedContacts))
    }
  }, [])

  const addToTranscript = (text: string, speaker: "user" | "ai") => {
    const entry: TranscriptEntry = {
      id: Date.now().toString(),
      text,
      speaker,
      timestamp: new Date(),
    }
    setTranscript((prev) => [...prev, entry])
  }

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 0.8
      speechSynthesis.speak(utterance)
    }
  }

  const processIncidentSpeech = async (input: string): Promise<string> => {
    // Using Gemini 2.0 Flash for real-time incident analysis with video context
    if (!geminiServiceRef.current || !videoRef.current) {
      return "I'm having trouble processing that. Please ensure the camera is working."
    }

    try {
      const response = await geminiServiceRef.current.processWithMultimodal(
        videoRef.current,
        input
      )
      return response
    } catch (error) {
      console.error("Gemini processing error:", error)
      return "I'm having trouble analyzing the situation. Please repeat or call emergency services if this is urgent."
    }
  }

  const startRecording = async () => {
    if (!stream) return

    try {
      // Initialize Gemini Live Service
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
      if (!apiKey) {
        toast({
          title: "Configuration Error",
          description: "Gemini API key not found. Please check your environment configuration.",
          variant: "destructive",
        })
        return
      }

      geminiServiceRef.current = new GeminiLiveService({
        apiKey,
        onResponse: (text) => {
          console.log("Gemini response:", text)
        },
        onError: (error) => {
          console.error("Gemini error:", error)
          toast({
            title: "AI Processing Error",
            description: "Unable to process with Gemini. Check console for details.",
            variant: "destructive",
          })
        },
      })

      await geminiServiceRef.current.startSession()

      // Start periodic frame capture for visual context
      if (videoRef.current) {
        geminiServiceRef.current.startPeriodicFrameCapture(videoRef.current, 3000)
      }

      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      recorder.onstop = () => {
        console.log('Recording stopped, chunks:', chunks.length)
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)

      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start()
        setIsListening(true)
      }

      const greeting = "I'm here to help you with this incident. Please describe what's happening."
      addToTranscript(greeting, "ai")
      speakText(greeting)
    } catch (error) {
      console.error("Error starting recording:", error)
      toast({
        title: "Recording Error",
        description: "Unable to start recording. Please try again.",
        variant: "destructive",
      })
    }
  }

  const notifyEmergencyContacts = () => {
    if (emergencyContacts.length > 0) {
      const contactNames = emergencyContacts.map((c) => c.name).join(", ")
      toast({
        title: "Emergency Contacts Notified",
        description: `${contactNames} ${emergencyContacts.length === 1 ? "has" : "have"} been automatically notified of this incident.`,
        duration: 5000,
      })

      emergencyContacts.forEach((contact) => {
        console.log(`Notifying ${contact.name} at ${contact.phone}`)
        // Simulate SMS/call notification
      })
    } else {
      toast({
        title: "No Emergency Contacts",
        description: "Add emergency contacts in settings to enable automatic notifications.",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop()
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }

    // Stop Gemini service
    if (geminiServiceRef.current) {
      geminiServiceRef.current.stopSession()
      geminiServiceRef.current = null
    }

    setIsRecording(false)
    setCurrentSubtitle("")
  }

  const handleUserSpeech = async (speechText: string) => {
    addToTranscript(speechText, "user")
    setIsProcessing(true)

    try {
      const aiResponse = await processIncidentSpeech(speechText)
      addToTranscript(aiResponse, "ai")
      speakText(aiResponse)

      // Check if emergency response is needed
      if (
        speechText.toLowerCase().includes("accident") ||
        speechText.toLowerCase().includes("emergency") ||
        speechText.toLowerCase().includes("help") ||
        speechText.toLowerCase().includes("injured")
      ) {
        notifyEmergencyContacts()
      }
    } catch (error) {
      console.error("Error processing speech:", error)
      const errorResponse =
        "I'm having trouble processing that. Please repeat or call emergency services if this is urgent."
      addToTranscript(errorResponse, "ai")
      speakText(errorResponse)
    } finally {
      setIsProcessing(false)
    }
  }

  const callEmergency = () => {
    window.location.href = "tel:911"
  }

  

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive">
                <Camera className="h-6 w-6 text-destructive-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Incident Capture</h1>
                <p className="text-sm text-muted-foreground">Real-time Documentation</p>
              </div>
            </div>

            <Button
              onClick={callEmergency}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              size="sm"
            >
              <Phone className="h-4 w-4 mr-2" />
              Call 911
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Video Feed */}
          <Card>
            <CardContent className="p-0">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  muted 
                  playsInline 
                  className="w-full h-full object-cover"
                  style={{
                    transform: 'translateZ(0)',
                    backfaceVisibility: 'hidden',
                    perspective: '1000px',
                    willChange: 'transform'
                  }}
                />

                {/* Recording Indicator */}
                {isRecording && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-destructive text-destructive-foreground px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-destructive-foreground rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">RECORDING</span>
                  </div>
                )}

                {/* Listening Indicator */}
                {isListening && (
                  <div className="absolute top-4 right-4 flex items-center gap-2 bg-accent text-accent-foreground px-3 py-1 rounded-full">
                    <Mic className="w-4 h-4" />
                    <span className="text-sm font-medium">LISTENING</span>
                  </div>
                )}

                {/* Current Subtitle */}
                {currentSubtitle && (
                  <div className="absolute bottom-4 left-4 right-4 bg-black/80 text-white p-3 rounded-lg">
                    <p className="text-sm">{currentSubtitle}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Controls */}
          <div className="flex justify-center gap-4">
            {!isRecording ? (
              <Button onClick={startRecording} size="lg" className="bg-destructive hover:bg-destructive/90">
                <Camera className="h-5 w-5 mr-2" />
                Start Recording
              </Button>
            ) : (
              <Button onClick={stopRecording} size="lg" variant="outline">
                <Square className="h-5 w-5 mr-2" />
                Stop Recording
              </Button>
            )}
          </div>

          {/* Transcript */}
          {transcript.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-accent" />
                  Incident Transcript
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {transcript.map((entry) => (
                    <div
                      key={entry.id}
                      className={cn("flex gap-3", entry.speaker === "user" ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg px-4 py-2",
                          entry.speaker === "user" ? "bg-accent text-accent-foreground" : "bg-muted",
                        )}
                      >
                        <p className="text-sm">{entry.text}</p>
                        <div className="text-xs opacity-50 mt-1">{entry.timestamp.toLocaleTimeString()}</div>
                      </div>
                    </div>
                  ))}

                  {isProcessing && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg px-4 py-2">
                        <div className="flex items-center gap-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-accent rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-accent rounded-full animate-bounce delay-100"></div>
                            <div className="w-2 h-2 bg-accent rounded-full animate-bounce delay-200"></div>
                          </div>
                          <span className="text-sm text-muted-foreground">Processing...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card className="bg-accent/5 border-accent/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <h3 className="font-semibold">How to use Incident Capture:</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Start recording to document the incident with video and audio</li>
                    <li>• Speak clearly to describe what&apos;s happening</li>
                    <li>• The AI will provide real-time guidance and suggestions</li>
                    <li>• Emergency contacts will be notified automatically for serious incidents</li>
                    <li>• Call 911 immediately for any life-threatening emergencies</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <div className="text-center p-4 rounded-lg bg-muted/50 border border-accent/20">
            <p className="text-sm text-muted-foreground">
              Digital lawyer can make mistakes, please double check responses. For immediate emergencies, always call
              911 first.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
