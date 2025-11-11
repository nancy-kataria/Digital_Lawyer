import { BaseModelProvider, ModelMessage, ModelResponse, ModelAvailability } from "./base-provider";
import { ImageData } from "../image-utils";
import { ModelConfig } from "@/models/model-config";

interface GeminiPart {
  text?: string;
  inline_data?: {
    mime_type: string;
    data: string;
  };
}

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

export class GeminiProvider extends BaseModelProvider {
  name: string;
  private config: ModelConfig;
  private apiKey: string;
  private baseUrl = "https://generativelanguage.googleapis.com/v1beta";

  constructor(config: ModelConfig, apiKey: string) {
    super();
    this.config = config;
    this.name = config.description;
    this.apiKey = apiKey;
  }

  async checkAvailability(): Promise<ModelAvailability> {
    const errors: string[] = [];
    let textModel = false;
    let visionModel = false;

    try {
      if (!this.apiKey || this.apiKey === "your-api-key-here") {
        errors.push("Gemini API key not configured. Set GEMINI_API_KEY environment variable.");
        return { textModel: false, visionModel: false, errors };
      }

      // Test API key with a minimal request
      const response = await fetch(
        `${this.baseUrl}/models/gemini-2.0-flash-exp:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "test" }] }]
          })
        }
      );

      if (response.ok) {
        textModel = true;
        visionModel = true; // Gemini 2.5 Pro supports vision
      } else {
        const errorData = await response.json();
        errors.push(`Gemini API error: ${errorData.error?.message || "Unknown error"}`);
      }
    } catch (error) {
      errors.push(`Failed to connect to Gemini API: ${error}`);
    }

    return { textModel, visionModel, errors };
  }

  async generateText(messages: ModelMessage[]): Promise<ModelResponse> {
    try {
      // Convert messages to Gemini format
      const contents = this.formatMessagesForGemini(messages);

      const requestBody = {
        contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        ],
      };

      const response = await fetch(
        `${this.baseUrl}/models/${this.config.textModel}:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!content) {
        throw new Error("No content in Gemini response");
      }

      return {
        success: true,
        content,
        model_used: `${this.config.textModel} (${this.name})`,
      };
    } catch (error) {
      return {
        success: false,
        error: `Gemini text generation failed: ${error}`,
        model_used: this.config.textModel,
      };
    }
  }

  async analyzeImage(imageData: ImageData, prompt: string): Promise<ModelResponse> {
    try {
      const fullPrompt = `Please analyze this image and provide a detailed description. Context from user: ${prompt}`;

      // Gemini expects inline data format for images
      const requestBody = {
        contents: [
          {
            parts: [
              { text: fullPrompt },
              {
                inline_data: {
                  mime_type: imageData.mimeType || "image/jpeg",
                  data: imageData.base64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
      };

      const response = await fetch(
        `${this.baseUrl}/models/${this.config.visionModel}:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!content) {
        throw new Error("No content in Gemini vision response");
      }

      return {
        success: true,
        content,
        model_used: `${this.config.visionModel} (${this.name})`,
      };
    } catch (error) {
      return {
        success: false,
        error: `Gemini image analysis failed: ${error}`,
        model_used: this.config.visionModel,
      };
    }
  }

  private formatMessagesForGemini(messages: ModelMessage[]): GeminiContent[] {
    const contents: GeminiContent[] = [];
    let systemInstruction = "";

    for (const msg of messages) {
      if (msg.role === "system") {
        // Gemini doesn't have a system role, prepend to first user message
        systemInstruction = msg.content;
        continue;
      }

      const parts: GeminiPart[] = [{ text: msg.content }];

      // Add images if present
      if (msg.images && msg.images.length > 0) {
        for (const image of msg.images) {
          parts.push({
            inline_data: {
              mime_type: "image/jpeg",
              data: image,
            },
          });
        }
      }

      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts,
      });
    }

    // Prepend system instruction to first user message
    if (systemInstruction && contents.length > 0 && contents[0].role === "user") {
      contents[0].parts[0].text = `${systemInstruction}\n\n${contents[0].parts[0].text}`;
    }

    return contents;
  }
}