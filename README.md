# Digital Lawyer

Digital Lawyer is a privacy-first AI legal assistant designed to provide legal guidance while protecting your sensitive information. Unlike cloud-based AI services that may store and analyze your conversations, Digital Lawyer runs entirely on your device using local AI models.


## Basic Text Generation:

Provider: Ollama
Model: Gemma3n:4b

```
const model_provider = {
        provider: "ollama-local",
        textModel: "gemma3:4b",
        visionModel: "llava:7b",
        description: "Local Ollama instance",
      }

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
```
