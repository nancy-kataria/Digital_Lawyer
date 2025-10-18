import { NextRequest, NextResponse } from "next/server";

export type ModelProvider = "ollama-local";

export interface ModelConfig {
  provider: ModelProvider;
  textModel: string;
  visionModel: string;
  apiUrl?: string;
  description: string;
}

export interface ProviderConfig {
  [key: string]: ModelConfig;
}

export interface ModelMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  images?: string[]; // base64 encoded images
}

export async function POST(request: NextRequest) {
  try {
    const { userInput } = await request.json();

    // check if the text is a string
    if (!userInput || typeof userInput !== "string") {
      return NextResponse.json(
        { success: false, error: "User input is required" },
        { status: 400 }
      );
    }

    const model_provider = {
        provider: "ollama-local",
        textModel: "gemma3:4b",
        visionModel: "llava:7b",
        description: "Local Ollama instance",
      }

    // promt according to the legal assistance
    const systemPrompt = "You are a helpful legal assistant AI. Provide general legal information and guidance, but always remind users to consult with a qualified attorney for specific legal advice. Be helpful, accurate, and professional. Please limit your responses to 2 or 3 paragraphs.";

    const messages: ModelMessage[] = [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user", 
        content: userInput
      }
    ];

    // fetching response using ollama
    const response = await fetch('http://127.0.0.1:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model_provider.textModel,
        messages: messages,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      response: data.message.content
    });

  } catch (error) {
    console.error("Error generating AI response:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate AI response",
      },
      { status: 500 }
    );
  }
}
