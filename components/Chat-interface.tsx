"use client"

import { Paperclip, Send, Scale, User,  Mic, MicOff, Volume2, VolumeX, ArrowLeft, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { AIResponse } from "@/components/AI-response";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/UI/Button"
import { Input } from "@/components/UI/Input"
import { ScrollArea } from "@/components/UI/Scroll-Area"
import { generateLegalResponse } from "@/models/generate-response"

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  attachments?: File[]
  isAudio?: boolean
}

interface ChatInterfaceProps {
  onBack: () => void
}

export function ChatInterface({ onBack }: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [recognition, setRecognition] = useState<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  // https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [recordingText, setRecordingText] = useState("")
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null)
  // https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content:
        "Hello! I'm your Digital Legal Assistant. I can help you with legal questions, document review, and general legal guidance. You can type your questions or use the microphone button to record voice messages. How can I assist you today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);

  useEffect(() => {
    // Check if we're running in a browser environment (not server-side rendering)
    if (typeof window !== "undefined") {
      // Get the Speech Recognition API - try standard first, then webkit prefixed version for Safari
      // https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        // Creating a new speech recognition instance
        const recognitionInstance = new SpeechRecognition()

        // speech recognition settings
        recognitionInstance.continuous = true //Keep listening until manually stopped
        recognitionInstance.interimResults = true // Return partial results as user speak
        recognitionInstance.lang = "en-US" // Set language to English (US)

        recognitionInstance.onresult = (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          let finalTranscript = ""
          let interimTranscript = ""

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript

            // Separate final results (completed words) from interim results (in-progress words)
            if (event.results[i].isFinal) {
              finalTranscript += transcript
            } else {
              interimTranscript += transcript
            }
          }

          const fullTranscript = finalTranscript + interimTranscript
          setRecordingText(fullTranscript) // Show live transcription to user

          if (finalTranscript) {
            setInputValue((prev) => prev + finalTranscript)
          }
        }

        // Handle when speech recognition stops
        recognitionInstance.onend = () => {
          setIsRecording(false)
          setRecordingText("")
        }

        recognitionInstance.onerror = (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          console.error("Speech recognition error:", event.error)
          setIsRecording(false)
          setRecordingText("")
        }
        // Store the configured recognition instance in state
        setRecognition(recognitionInstance)
      }

      if (typeof window !== "undefined" && window.speechSynthesis) {
        setSpeechSynthesis(window.speechSynthesis)
      }
    }
  }, []) // Removed dependencies to avoid stale closure issues

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const toggleRecording = async () => {
    if (!recognition) {
      alert("Speech recognition is not supported in your browser.")
      return
    }

    if (isRecording) {
      // Stop recording
      recognition.stop()
      if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop()
      }
      setIsRecording(false)
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const recorder = new MediaRecorder(stream)
        setMediaRecorder(recorder)

        recorder.start()
        recognition.start()
        setIsRecording(true)
        setRecordingText("")

        recorder.onstop = () => {
          stream.getTracks().forEach((track) => track.stop())
        }
      } catch (error) {
        console.error("Error accessing microphone:", error)
        alert("Unable to access microphone. Please check your permissions.")
      }
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() && attachments.length === 0) return

    const isVoiceMessage = recordingText.length > 0 || inputValue.includes(recordingText)

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
      isAudio: isVoiceMessage, // Mark as audio message if it came from voice input
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setAttachments([])
    setRecordingText("") // Clear recording text after sending
    setIsLoading(true)

    try {
      // Build conversation history (exclude welcome message)
      const conversationHistory = messages
        .filter(msg => msg.id !== "welcome")
        .map(msg => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.content
      }));

      const aiResponse = await generateLegalResponse(inputValue, attachments, conversationHistory)

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: "ai",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      console.error("Error generating AI response:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
        sender: "ai",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setAttachments((prev) => [...prev, ...files])
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSpeakMessage = (messageId: string, content: string) => {
    if (!speechSynthesis) {
      alert("Text-to-speech is not supported in your browser.")
      return
    }

    // If currently speaking this message, stop it
    if (speakingMessageId === messageId) {
      speechSynthesis.cancel()
      setSpeakingMessageId(null)
      return
    }

    // Stop any current speech
    speechSynthesis.cancel()

    // Create and configure speech utterance
    const utterance = new SpeechSynthesisUtterance(content)
    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.volume = 0.8

    utterance.onstart = () => {
      setSpeakingMessageId(messageId)
    }

    utterance.onend = () => {
      setSpeakingMessageId(null)
    }

    utterance.onerror = () => {
      setSpeakingMessageId(null)
    }

    // Start speaking
    speechSynthesis.speak(utterance)
  }

  /**
   * Enabling enter key
   */
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
              <Bot className="h-6 w-6 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">AI Legal Advisor</h1>
              <p className="text-sm text-muted-foreground">Digital Legal Assistant</p>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 container mx-auto px-4 py-6">
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-4 max-w-4xl mx-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.sender === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.sender === "ai" && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 flex-shrink-0">
                    <Scale className="h-4 w-4 text-accent" />
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-3",
                    message.sender === "user"
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted"
                  )}
                >
                  {message.sender === "ai" && (
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSpeakMessage(message.id, message.content)}
                        className="h-6 w-6 p-0 hover:bg-accent/20"
                        disabled={!speechSynthesis}
                      >
                        {speakingMessageId === message.id ? (
                          <VolumeX className="h-3 w-3" />
                        ) : (
                          <Volume2 className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  )}
                  {message.sender === "ai" ? (
                    <AIResponse content={message.content} className="text-sm" />
                  ) : (
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  )}
                </div>

                {message.sender === "user" && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 flex-shrink-0">
                  <Scale className="h-4 w-4 text-accent" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-accent rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-accent rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-accent rounded-full animate-bounce delay-200"></div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      generating response
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div />
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="border-t bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {isRecording && (
              <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <p className="text-sm text-red-700">
                  Recording... {recordingText && `"${recordingText}"`}
                  <span className="block text-xs mt-1">Click the microphone again to stop recording</span>
                </p>
              </div>
            )}

            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm">
                    <Paperclip className="h-4 w-4" />
                    <span className="truncate max-w-32">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                      className="h-4 w-4 p-0 hover:bg-destructive/20"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}


            {/* Input */}
            <div className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                className="hidden"
              />

              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="flex-shrink-0"
                disabled={isRecording}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                variant={isRecording ? "destructive" : "outline"}
                size="sm"
                onClick={toggleRecording}
                className="flex-shrink-0"
                disabled={isLoading}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>

              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isRecording ? "Recording audio..." : "Ask your legal question..."}
                className="flex-1"
                disabled={isLoading} // Allow editing while recording
              />

              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
