import { GoogleGenAI } from "@google/genai";

export interface GeminiLiveConfig {
  apiKey: string;
  onResponse: (text: string) => void;
  onError: (error: Error) => void;
}

export class GeminiLiveService {
  private genAI: GoogleGenAI;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private model: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private chat: any;
  private isStreaming: boolean = false;
  private config: GeminiLiveConfig;
  private videoFrameInterval: number | null = null;

  constructor(config: GeminiLiveConfig) {
    this.config = config;
    this.genAI = new GoogleGenAI({
      apiKey: config.apiKey,
    });
  }

  async startSession() {
    try {
      // Initialize with model name for use in API calls
      this.model = "gemini-2.0-flash-exp";
      this.chat = []; // Store conversation history
      this.isStreaming = true;
    } catch (error) {
      this.config.onError(error as Error);
      throw error;
    }
  }

  async sendVideoFrame(videoElement: HTMLVideoElement) {
    if (!this.isStreaming || !videoElement) return;

    try {
      // Create canvas to capture video frame
      const canvas = document.createElement("canvas");
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const ctx = canvas.getContext("2d");
      
      if (!ctx) return;

      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      
      // Convert to base64 JPEG
      const base64Image = canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
      
      return base64Image;
    } catch (error) {
      console.error("Error capturing video frame:", error);
    }
  }

  async processWithMultimodal(
    videoElement: HTMLVideoElement,
    audioText: string
  ): Promise<string> {
    if (!this.isStreaming || !this.model) {
      throw new Error("Session not started");
    }

    try {
      const base64Image = await this.sendVideoFrame(videoElement);
      
      const parts = [];
      
      // Add text prompt with system instruction
      const systemPrompt = `You are an AI assistant helping users document and respond to incidents in real-time.
Your role is to:
- Analyze video and audio input to understand what's happening
- Provide clear, actionable guidance for the situation  
- Prioritize safety and recommend emergency services when appropriate
- Be concise and speak naturally (your responses will be read aloud)
- Ask clarifying questions when needed
- Document important details for incident reports

For emergencies involving injuries, fire, or immediate danger, always recommend calling 911 first.

User says: ${audioText || "What do you observe in this scene? Provide relevant guidance."}`;
      
      parts.push({
        text: systemPrompt,
      });

      // Add image if available
      if (base64Image) {
        parts.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image,
          },
        });
      }

      // Build contents with conversation history
      const contents = [...this.chat, { role: "user", parts }];

      // Send to Gemini
      const result = await this.genAI.models.generateContent({
        model: this.model,
        contents,
        config: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      });

      const text = result.text || "";

      // Update conversation history
      this.chat.push(
        { role: "user", parts },
        { role: "model", parts: [{ text }] }
      );

      return text;
    } catch (error) {
      this.config.onError(error as Error);
      throw error;
    }
  }

  startPeriodicFrameCapture(videoElement: HTMLVideoElement, intervalMs: number = 3000) {
    // Clear any existing interval
    this.stopPeriodicFrameCapture();

    // Capture frames periodically to give Gemini visual context
    this.videoFrameInterval = window.setInterval(async () => {
      if (this.isStreaming && videoElement) {
        try {
          await this.sendVideoFrame(videoElement);
          // Frames are captured for context when user speaks
        } catch (error) {
          console.error("Error in periodic frame capture:", error);
        }
      }
    }, intervalMs);
  }

  stopPeriodicFrameCapture() {
    if (this.videoFrameInterval) {
      clearInterval(this.videoFrameInterval);
      this.videoFrameInterval = null;
    }
  }

  stopSession() {
    this.isStreaming = false;
    this.stopPeriodicFrameCapture();
    this.chat = null;
  }

  isActive(): boolean {
    return this.isStreaming;
  }
}
