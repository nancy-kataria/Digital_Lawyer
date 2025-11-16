"use client"

import { Button } from "@/components/UI/Button"
import { Card, CardContent } from "@/components/UI/Card"
import { ArrowLeft, Camera, AlertTriangle, Phone } from "lucide-react"

interface IncidentCaptureProps {
  onBack: () => void
}

export function IncidentCapture({ onBack }: IncidentCaptureProps) {
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
              </div>
            </CardContent>
          </Card>

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
