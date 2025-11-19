"use client"

import { Scale, Shield, Users, MessageSquare, Camera} from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/UI/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/UI/Card"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                <Scale className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Digital Lawyer</h1>
                <p className="text-sm text-muted-foreground">AI Legal Assistant</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Hero Section with Lady Justice */}
          <div className="text-center space-y-6">
            <div className="relative mx-auto mb-8">
              <div className="relative mx-auto w-48 h-48 md:w-56 md:h-56 rounded-full bg-gradient-to-br from-accent/10 to-accent/5 p-4 shadow-lg">
                <Image
                  src="/lawnorder.jpeg"
                  alt="Lady Justice - Symbol of Legal Authority"
                  width={224}
                  height={224}
                  className="w-full h-full object-cover rounded-full shadow-md"
                />
                <div className="absolute inset-0 rounded-full bg-gradient-to-t from-primary/10 to-transparent"></div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent rounded-full animate-pulse"></div>
              <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-accent/60 rounded-full animate-pulse delay-1000"></div>
            </div>

            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold text-balance bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Welcome to Digital Lawyer
              </h2>
              <p className="text-xl md:text-2xl text-muted-foreground text-pretty max-w-2xl mx-auto leading-relaxed">
                Your Private, On-Device AI Legal Assistant
              </p>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-accent" />
                <span>Secure & Private</span>
              </div>
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-accent" />
                <span>Legal Guidance</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-accent" />
                <span>24/7 Available</span>
              </div>
            </div>
          </div>

          {/* Get Yours Today Button */}
          <div className="flex justify-center">
            <a 
              href="https://github.com/nancy-kataria/Digital_Lawyer/releases"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90 text-white font-bold text-lg px-8 py-6 rounded-full shadow-2xl hover:shadow-accent/50 transition-all duration-300 hover:scale-105 animate-pulse hover:animate-none"
              >
                Get Yours Today
              </Button>
            </a>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <Card
              className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border-accent/50 bg-gradient-to-br from-card to-card/80"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 group-hover:bg-accent/20 transition-colors">
                    <MessageSquare className="h-7 w-7 text-accent" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl group-hover:text-accent transition-colors">
                      Talk to AI Legal Advisor
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription className="text-pretty text-base leading-relaxed">
                  Chat with our AI legal assistant. Ask questions, upload documents, and get legal guidance through text
                  conversation with instant responses.
                </CardDescription>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full"></div>
                    <span>Upload legal documents</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full"></div>
                    <span>Get instant legal guidance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full"></div>
                    <span>Text-based conversation</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border-accent/50 bg-gradient-to-br from-card to-card/80"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 group-hover:bg-accent/20 transition-colors">
                    <Camera className="h-7 w-7 text-accent" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl group-hover:text-accent transition-colors">
                      Capture an Incident
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription className="text-pretty text-base leading-relaxed">
                  Record incidents in real-time with video and audio. Get immediate AI guidance.
                </CardDescription>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full"></div>
                    <span>Coming Soon</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full"></div>
                    <span>Real-time video recording</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full"></div>
                    <span>Voice-activated assistance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full"></div>
                    <span>Emergency contact alerts</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </div>
  )
}
