"use client"

import { Send, Scale, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { AIResponse } from "@/components/AI-response";
import { useState } from "react";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content:
        "Hello! I'm your Digital Legal Assistant. I can help you with legal questions, document review, and general legal guidance. You can type your questions or use the microphone button to record voice messages. How can I assist you today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputValue,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        sender: "ai",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error generating AI response:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div>
          <h1 className="text-xl font-bold">AI Legal Advisor</h1>
          <p className="text-sm text-muted-foreground">
            Digital Legal Assistant
          </p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 container mx-auto px-4 py-6">
        <div className="h-[calc(100vh-200px)]">
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
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                // className="hidden"
                disabled={isLoading}
              />

              <button onClick={handleSendMessage}>
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
